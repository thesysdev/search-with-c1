import { makeC1Response } from "@thesysai/genui-sdk/server";

import {
  addUserMessage,
  addAssistantMessage,
  ThreadMessage,
} from "../../cache/threadCache";
import { exaSearch } from "../../services/exaSearch";
import { googleGenAISearch } from "../../services/googleGenAiSearch";
import {
  SearchProvider,
  SearchProviderConfig,
} from "../../types/searchProvider";
import { UnifiedSearchResponse } from "../../types/unifiedSearchResponse";

import { findCachedTurn } from "./findCachedTurn";

/**
 * Gets the search response from the specified search provider.
 * If a cached response is available, it returns the cached data.
 * Otherwise, it fetches the search response from the chosen provider and caches it.
 * @param threadId The ID of the thread.
 * @param prompt The user's prompt.
 * @param threadHistory The history of the thread.
 * @param c1Response The C1 response object.
 * @param signal The abort signal.
 * @param config The search provider configuration.
 * @returns A promise that resolves to an object containing the search response and the assistant message.
 */
export const getSearchResponse = async (
  threadId: string,
  prompt: string,
  threadHistory: ThreadMessage[],
  c1Response: ReturnType<typeof makeC1Response>,
  signal: AbortSignal,
  config: SearchProviderConfig = { provider: SearchProvider.GEMINI },
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
    let searchResponse: UnifiedSearchResponse;

    // Choose search provider based on config
    if (config.provider === SearchProvider.EXA) {
      c1Response.writeThinkItem({
        title: "Using Exa Search",
        description: "Searching with Exa for high-quality, structured results",
      });

      const exaResponse = await exaSearch(
        prompt,
        (progress) => {
          if (signal.aborted) return;
          c1Response.writeThinkItem({
            title: progress.title,
            description: progress.content,
          });
        },
        signal,
        config.numResults || 10,
      );

      searchResponse = {
        provider: SearchProvider.EXA,
        searchQuery: prompt,
        results: exaResponse.results,
        metadata: {
          numResults: exaResponse.numResults,
        },
      };
    } else {
      // Default to Gemini
      c1Response.writeThinkItem({
        title: "Using Gemini Search",
        description:
          "Searching with Gemini's built-in Google Search capability",
      });

      const geminiResponse = await googleGenAISearch(
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

      searchResponse = {
        provider: SearchProvider.GEMINI,
        searchQuery: prompt,
        content: geminiResponse,
      };
    }

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
    console.error(`Error calling ${config.provider} search:`, error);
    throw new Error(`Failed to get search response from ${config.provider}.`);
  }
};
