"use server";

import { makeC1Response } from "@thesysai/genui-sdk/server";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import {
  addAssistantMessage,
  addUserMessage,
  getThread,
  updateAssistantMessage,
  UserMessage,
  AssistantMessage,
  ThreadMessage,
} from "../cache/threadCache";
import { callGoogleGenAI } from "../utils/api";
import { transformStream } from "@crayonai/stream";
import { SYSTEM_PROMPT } from "./systemPrompt";

const client = new OpenAI({
  baseURL: "https://api.dev.thesys.dev/v1/visualize",
  apiKey: process.env.THESYS_API_KEY,
});

const findCachedTurn = (
  prompt: string,
  history: ThreadMessage[],
): { user: UserMessage; assistant: AssistantMessage } | undefined => {
  for (let i = 0; i < history.length - 1; i++) {
    const userMsg = history[i];
    if (
      userMsg.role === "user" &&
      userMsg.prompt === prompt &&
      i + 1 < history.length
    ) {
      const assistantMsg = history[i + 1];
      if (assistantMsg.role === "assistant") {
        return {
          user: userMsg as UserMessage,
          assistant: assistantMsg as AssistantMessage,
        };
      }
    }
  }
  return undefined;
};

const getSearchResponse = async (
  threadId: string,
  prompt: string,
  threadHistory: ThreadMessage[],
  c1Response: ReturnType<typeof makeC1Response>,
  signal: AbortSignal,
) => {
  const cachedTurn = findCachedTurn(prompt, threadHistory);
  if (cachedTurn?.assistant.searchResponse) {
    return {
      searchResponse: cachedTurn.assistant.searchResponse,
      assistantMessage: cachedTurn.assistant,
    };
  }

  const searchResponse = await callGoogleGenAI(
    prompt,
    threadHistory,
    (progress) => {
      if (signal.aborted) return;
      c1Response.writeThinkItem({
        title: progress.title,
        description: progress.content,
      });
    },
  );

  await addUserMessage(threadId, prompt);
  const assistantMessage = await addAssistantMessage(threadId, {
    searchResponse,
  });
  return { searchResponse, assistantMessage };
};

const generateAndStreamC1Response = async ({
  threadId,
  prompt,
  threadHistory,
  searchResponse,
  assistantMessage,
  c1Response,
  signal,
}: {
  threadId: string;
  prompt: string;
  threadHistory: ThreadMessage[];
  searchResponse: any;
  assistantMessage: AssistantMessage;
  c1Response: ReturnType<typeof makeC1Response>;
  signal: AbortSignal;
}) => {
  const messages: ChatCompletionMessageParam[] = threadHistory
    .filter((msg) => msg.messageId !== assistantMessage.messageId)
    .map((msg) => {
      if (msg.role === "user") {
        return {
          role: "user",
          content: msg.prompt,
        };
      }
      const content = msg.c1Response
        ? msg.c1Response
        : `Here is the response from the web search: ${JSON.stringify(
            msg.searchResponse,
          )}`;
      return {
        role: "assistant",
        content,
      };
    });

  const llmStream = await client.chat.completions.create({
    model: "c1-nightly",
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      ...messages,
      {
        role: "user",
        content: prompt,
      },
      {
        role: "assistant",
        content: `Here is the response from the web search: ${JSON.stringify(
          searchResponse,
        )}`,
      },
    ],
    stream: true,
  });

  let finalC1Response = "";
  transformStream(
    llmStream,
    (chunk) => {
      if (signal.aborted) return "";
      const contentDelta = chunk.choices[0]?.delta?.content || "";
      if (contentDelta) {
        finalC1Response += contentDelta;
        try {
          c1Response.writeContent(contentDelta);
        } catch (error) {
          if (!signal.aborted) {
            console.error("Error writing content:", error);
          }
        }
      }
      return contentDelta;
    },
    {
      onEnd: async () => {
        try {
          if (!signal.aborted) {
            await updateAssistantMessage(
              threadId,
              assistantMessage.messageId,
              {
                c1Response: finalC1Response,
              },
            );
            c1Response.end();
          }
        } catch (error) {
          console.error(
            "Stream already closed or error updating cache:",
            error,
          );
        }
      },
    },
  );
};

interface AskRequest {
  prompt: string;
  threadId: string;
}

/**
 * API route handler for ask endpoint
 * @param req The NextRequest object
 * @returns A streaming response
 */
export async function POST(req: NextRequest) {
  const c1Response = makeC1Response();

  try {
    if (req.signal.aborted) {
      return new Response("Request aborted", { status: 499 });
    }

    const { prompt, threadId } = (await req.json()) as AskRequest;

    const generateResponse = async () => {
      const originalThreadHistory = (await getThread(threadId)) || [];
      const cachedTurn = findCachedTurn(prompt, originalThreadHistory);

      if (cachedTurn?.assistant.c1Response) {
        c1Response.writeContent(cachedTurn.assistant.c1Response);
        c1Response.end();
        return;
      }

      const { searchResponse, assistantMessage } = await getSearchResponse(
        threadId,
        prompt,
        originalThreadHistory,
        c1Response,
        req.signal,
      );

      const threadHistory = (await getThread(threadId)) || [];

      await generateAndStreamC1Response({
        threadId,
        prompt,
        threadHistory,
        searchResponse,
        assistantMessage,
        c1Response,
        signal: req.signal,
      });
    };

    generateResponse();

    const responseHeaders = {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Thread-Id": threadId,
    };

    return new Response(c1Response.responseStream, {
      headers: responseHeaders,
    });
  } catch (error) {
    // Handle abort errors gracefully
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"))
    ) {
      console.log("Request aborted");
      try {
        c1Response.end();
      } catch {
        // Ignore errors when ending aborted response
      }
      return new Response("Request aborted", { status: 499 });
    }

    console.error("Error in POST handler:", error);
    try {
      c1Response.end();
    } catch {
      // Ignore errors when ending error response
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
