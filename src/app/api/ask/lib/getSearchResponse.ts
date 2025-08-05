import { makeC1Response } from "@thesysai/genui-sdk/server";

import {
  addUserMessage,
  addAssistantMessage,
  ThreadMessage,
} from "../../cache/threadCache";
import { googleGenAISearch } from "../../services/googleGenAiSearch";

import { findCachedTurn } from "./findCachedTurn";

/**
 * Gets the search response from the Google Gen AI service.
 * If a cached response is available, it returns the cached data.
 * Otherwise, it fetches the search response from the service and caches it.
 * @param threadId The ID of the thread.
 * @param prompt The user's prompt.
 * @param threadHistory The history of the thread.
 * @param c1Response The C1 response object.
 * @param signal The abort signal.
 * @returns A promise that resolves to an object containing the search response and the assistant message.
 */
export const getSearchResponse = async (
  threadId: string,
  prompt: string,
  threadHistory: ThreadMessage[],
  c1Response: ReturnType<typeof makeC1Response>,
  signal: AbortSignal,
) => {
  const cachedTurn = findCachedTurn(prompt, threadHistory);
  if (cachedTurn?.assistant.searchResponse) {
    c1Response.writeThinkItem({
      title: "Using Cached Results",
      description:
        "Found previous search results for this query, skipping web search",
    });
    return {
      searchResponse: cachedTurn.assistant.searchResponse,
      assistantMessage: cachedTurn.assistant,
    };
  }

  try {
    const searchResponse = await googleGenAISearch(
      prompt,
      threadHistory,
      (progress) => {
        if (signal.aborted) return;
        c1Response.writeThinkItem({
          title: progress.title,
          description: progress.content,
        });
      },
      signal,
    );

    await addUserMessage(threadId, prompt);
    const assistantMessage = await addAssistantMessage(threadId, {
      searchResponse,
    });
    return { searchResponse, assistantMessage };
  } catch (error) {
    // Handle abort signal separately - don't log as error since it's intentional
    if (
      signal.aborted ||
      (error instanceof Error && error.message.includes("aborted"))
    ) {
      console.log("Search request was aborted");
      throw new Error(
        "Search request was cancelled because the request was aborted",
      );
    }

    // Log actual API errors
    console.error("Error calling Google Gen AI:", error);
    throw new Error("Failed to get search response from Google Gen AI.");
  }
};
