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

  try {
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
          c1Response.writeContent(cachedTurn.assistant.c1Response);
          c1Response.end();
          return;
        }

        const { searchResponse, assistantMessage } = await getSearchResponse(
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

        const updatedThreadHistory =
          (await getThread(threadId as string)) || [];
        await generateAndStreamC1Response({
          threadId: threadId as string,
          prompt,
          threadHistory: updatedThreadHistory,
          searchResponse,
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
          prompt,
          threadHistory,
          searchResponse: null,
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

    return new Response(c1Response.responseStream, {
      headers: responseHeaders,
    });
  } catch (error) {
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
