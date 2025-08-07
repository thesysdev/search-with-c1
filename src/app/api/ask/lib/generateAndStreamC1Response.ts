import { transformStream } from "@crayonai/stream";
import { makeC1Response } from "@thesysai/genui-sdk/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import {
  updateAssistantMessage,
  AssistantMessage,
  ThreadMessage,
} from "../../cache/threadCache";
import { SYSTEM_PROMPT } from "../systemPrompt";

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/visualize",
  apiKey: process.env.THESYS_API_KEY,
});

/**
 * Generates the C1 response and streams it back to the client.
 * @param threadId The ID of the thread.
 * @param prompt The user's prompt.
 * @param threadHistory The history of the thread.
 * @param searchResponse The search response from the Google Gen AI service.
 * @param assistantMessage The assistant message object.
 * @param c1Response The C1 response object.
 * @param signal The abort signal.
 * @param errorMessage An optional error message to include in the response.
 */
export const generateAndStreamC1Response = async ({
  threadId,
  threadHistory,
  assistantMessage,
  c1Response,
  signal,
  errorMessage,
}: {
  threadId: string;
  threadHistory: ThreadMessage[];
  assistantMessage: AssistantMessage;
  c1Response: ReturnType<typeof makeC1Response>;
  signal: AbortSignal;
  errorMessage?: string;
}) => {
  c1Response.writeThinkItem({
    title: "Composing Final Response",
    description:
      "Transforming search results into a user-friendly, interactive format",
  });

  const messages: ChatCompletionMessageParam[] = threadHistory
    .filter(
      (msg) => assistantMessage && msg.messageId !== assistantMessage.messageId,
    )
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
        role: "assistant",
        content: errorMessage
          ? `There was an error during the search: ${errorMessage}. Please respond to the user gracefully.`
          : JSON.stringify(assistantMessage.searchResponse),
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
          if (!signal.aborted && assistantMessage) {
            await updateAssistantMessage(threadId, assistantMessage.messageId, {
              c1Response: finalC1Response,
            });
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
