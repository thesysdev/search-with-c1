"use server";

import { makeC1Response } from "@thesysai/genui-sdk/server";
import { NextRequest } from "next/server";

import { getThread } from "../cache/threadCache";

import { findCachedTurn } from "./lib/findCachedTurn";
import { generateAndStreamC1Response } from "./lib/generateAndStreamC1Response";
import { getSearchResponse } from "./lib/getSearchResponse";

interface AskRequest {
  prompt: string;
  threadId: string;
}

/**
 * API route handler for the ask endpoint.
 * This function orchestrates the process of receiving a user's prompt,
 * fetching search results, generating a C1 response, and streaming it back to the client.
 * @param req The NextRequest object.
 * @returns A streaming response with the C1 content.
 */
export async function POST(req: NextRequest) {
  const c1Response = makeC1Response();
  let threadId: string | null = null;

  // Add error handling for the response stream
  const originalResponseStream = c1Response.responseStream;
  const responseStreamWithErrorHandling = new ReadableStream({
    start(controller) {
      const reader = originalResponseStream.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }
            controller.enqueue(value);
          }
        } catch (error) {
          if (
            req.signal.aborted ||
            (error instanceof Error && error.message.includes("aborted"))
          ) {
            console.log("Response stream aborted");
          } else {
            console.error("Response stream error:", error);
          }
          try {
            controller.error(error);
          } catch {
            // Ignore controller errors
          }
        }
      };
      pump().catch(() => {
        // Catch any unhandled errors from pump
      });
    },
  });

  if (req.signal.aborted) {
    return new Response("Request aborted", { status: 499 });
  }

  const { prompt, threadId: reqThreadId } = (await req.json()) as AskRequest;
  threadId = reqThreadId;

  const generateResponse = async () => {
    try {
      const threadHistory = (await getThread(threadId as string)) || [];
      const cachedTurn = findCachedTurn(prompt, threadHistory);

      if (cachedTurn?.assistant.c1Response) {
        try {
          // Check if request was aborted before writing cached content
          if (req.signal.aborted) {
            return;
          }
          c1Response.writeContent(cachedTurn.assistant.c1Response);
          c1Response.end();
        } catch (error) {
          // Ignore errors if stream is already closed (e.g., client disconnected)
          if (!req.signal.aborted) {
            console.error("Error writing cached response:", error);
          }
        }
        return;
      }

      const { assistantMessage } = await getSearchResponse(
        threadId as string,
        prompt,
        threadHistory,
        c1Response,
        req.signal,
      );

      if (!assistantMessage) {
        console.error(
          "No assistant message created. Aborting response generation.",
        );
        c1Response.end();
        return;
      }

      const updatedThreadHistory = (await getThread(threadId as string)) || [];

      await generateAndStreamC1Response({
        threadId: threadId as string,
        threadHistory: updatedThreadHistory,
        assistantMessage,
        c1Response,
        signal: req.signal,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      console.error(`Error generating response: ${message}`);

      const threadHistory = (await getThread(threadId as string)) || [];
      await generateAndStreamC1Response({
        threadId: threadId as string,
        threadHistory,
        assistantMessage: null as any,
        c1Response,
        signal: req.signal,
        errorMessage: message,
      });
    }
  };

  generateResponse();

  const responseHeaders = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Thread-Id": threadId,
  };

  return new Response(responseStreamWithErrorHandling, {
    headers: responseHeaders,
  });
}
