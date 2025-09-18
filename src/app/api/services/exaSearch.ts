"use server";

import Exa from "exa-js";


const exa = new Exa(process.env.EXA_API_KEY as string);

/**
 * Progress callback type for search updates
 */
type ProgressCallback = (progress: { title: string; content: string }) => void;

/**
 * Exa search response format
 */
export interface ExaSearchResponse {
  results: Array<{
    title: string;
    url: string;
    content?: string;
    snippet?: string;
    publishedDate?: string;
    author?: string;
  }>;
  searchQuery: string;
  numResults: number;
}

/**
 * Performs search using Exa's searchAndContents method
 * @param query The search query
 * @param writeProgress Callback to report search progress
 * @param signal Abort signal for cancellation
 * @param numResults Number of results to return (default: 10)
 * @returns Formatted search response
 */
export const exaSearch = async (
  query: string,
  writeProgress: ProgressCallback,
  signal?: AbortSignal,
  numResults: number = 10,
): Promise<ExaSearchResponse> => {
  try {
    writeProgress({
      title: "Initializing Exa Search",
      content: `Starting search with Exa for: "${query}"`,
    });

    // Check if request was aborted
    if (signal?.aborted) {
      throw new Error("Search request was aborted");
    }

    writeProgress({
      title: "Searching with Exa",
      content: "Retrieving high-quality search results and content...",
    });

    // Use Exa's searchAndContents to get both results and full text content
    const searchResponse = await exa.searchAndContents(query, {
      numResults,
      text: true, // Include full text content
      highlights: true, // Include highlights for better snippets
      type: "auto", // Let Exa choose between neural and keyword search
    });

    writeProgress({
      title: "Processing Results",
      content: `Found ${searchResponse.results.length} relevant results, extracting content...`,
    });

    // Check if request was aborted after search
    if (signal?.aborted) {
      throw new Error("Search request was aborted");
    }

    // Format the response to match our expected structure
    const formattedResults = searchResponse.results.map((result) => ({
      title: result.title || "Untitled",
      url: result.url,
      content: result.text || "",
      snippet:
        result.highlights?.[0] || `${result.text?.slice(0, 200)}...` || "",
      publishedDate: result.publishedDate || undefined,
      author: result.author || undefined,
    }));

    writeProgress({
      title: "Exa Search Complete",
      content: `Successfully retrieved ${formattedResults.length} results with full content from Exa`,
    });

    return {
      results: formattedResults,
      searchQuery: query,
      numResults: formattedResults.length,
    };
  } catch (error) {
    console.error("Error in Exa search:", error);

    // Handle abort signal separately
    if (
      signal?.aborted ||
      (error instanceof Error && error.message.includes("aborted"))
    ) {
      writeProgress({
        title: "Search Cancelled",
        content: "Search request was cancelled",
      });
      throw new Error("Search request was cancelled");
    }

    const errorTitle = "Exa Search Error";
    const errorDescription =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while searching with Exa.";

    writeProgress({
      title: errorTitle,
      content: errorDescription,
    });

    throw new Error(
      `Exa search failed: ${errorDescription}. Please try again or use a different search provider.`,
    );
  }
};
