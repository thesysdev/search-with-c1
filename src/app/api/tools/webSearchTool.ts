import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { googleWebSearch } from "../services/googleSearch";
import {
  extractWebsiteContent,
  summarizeWebsiteContent,
} from "../services/websiteContent";
import {
  GoogleCustomSearchResponseItem,
  TransformedWebResult,
} from "../types/search";

/**
 * Transforms Google search response to a more usable format
 */
function transformGoogleResponse(
  response: GoogleCustomSearchResponseItem[],
): TransformedWebResult[] {
  if (!response || !Array.isArray(response)) return [];

  return response.map((item) => {
    return {
      title: item.title,
      sourceURL: item.link,
      snippet: item.snippet,
      pageSummary: "",
      sourceImage: {
        fullImage: item.pagemap?.cse_image?.[0]?.src,
        thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src,
      },
    };
  });
}

/**
 * Creates a Google web search tool for OpenAI
 * @param writeProgress Callback to write progress updates
 * @returns A runnable tool function for OpenAI
 */
export const googleWebSearchTool = (
  writeProgress: (progress: { title: string; content: string }) => void,
): RunnableToolFunctionWithParse<{
  query: string;
  num?: number;
  cr?: string;
  gl?: string;
  siteSearch?: string;
  exactTerms?: string;
  dateRestrict?: string;
}> => ({
  type: "function",
  function: {
    name: "google_web_search",
    description:
      "Performs a real-time web search using the Google Custom Search API. \
        Use this tool when you need the most current information from the internet that may not be available in your existing data,\
        such as breaking news, recent articles, product updates, or the latest documentation.\
        The tool returns a list of search results, each containing the following fields: \
        title (the page title), sourceURL (the direct link to the page), snippet (a brief excerpt from the page), \
        pageSummary (a concise summary of the page content relevant to the query), and sourceImage (an object with optional fullImage and thumbnail URLs).\
        Use this tool when you require up-to-date, factual, or time-sensitive information that cannot be reliably answered from static or historical data.",
    parse: JSON.parse,
    parameters: zodToJsonSchema(
      z.object({
        query: z.string().describe("The search query to look up"),
        cr: z
          .string()
          .optional()
          .describe("Country restriction (e.g., 'countryUS')"),
        gl: z.string().optional().describe("Geolocation (e.g., 'us')"),
        siteSearch: z
          .string()
          .optional()
          .describe(
            "Restrict results to a specific site (e.g., 'example.com')",
          ),
        exactTerms: z
          .string()
          .optional()
          .describe("Only return results with this exact phrase"),
        dateRestrict: z
          .string()
          .optional()
          .describe(
            "Limit results by date (e.g., 'd[1]' for past day, 'w[1]' for past week)",
          ),
      }),
    ) as JSONSchema,
    function: async ({
      query,
      cr,
      gl,
      siteSearch,
      exactTerms,
      dateRestrict,
    }: {
      query: string;
      num?: number;
      cr?: string;
      gl?: string;
      siteSearch?: string;
      exactTerms?: string;
      dateRestrict?: string;
    }) => {
      try {
        writeProgress({
          title: "Initiating Query Resolution",
          content: `Finding the most relevant pages for: ${JSON.stringify(
            query,
          )}`,
        });

        const googleSearchResponse = await googleWebSearch({
          query,
          num: 3,
          cr,
          gl,
          siteSearch,
          exactTerms,
          dateRestrict,
        });

        if (
          !googleSearchResponse.items ||
          googleSearchResponse.items.length === 0
        ) {
          return "No results found";
        }

        const transformedGoogleResults = transformGoogleResponse(
          googleSearchResponse.items,
        );

        // Process extraction and summarization for each URL in parallel
        const combinedResults = await Promise.all(
          transformedGoogleResults.map(async (result) => {
            const url = result.sourceURL;
            try {
              writeProgress({
                title: "Structured Content Extraction",
                content: `Parsing content from ${url}...`,
              });
              // Step 1: Extract content for this specific URL
              const { results } = await extractWebsiteContent([url]);
              const content = results[0]?.content ?? "";

              // Step 2: Only summarize if we have content
              let summary = "";
              if (content) {
                writeProgress({
                  title: "Semantic Abstraction via LLM",
                  content: `Summarizing content from ${url}`,
                });
                summary = await summarizeWebsiteContent({
                  content,
                  query,
                });
              } else {
                summary = "Content extraction failed.";
              }

              return {
                summary,
                url,
              };
            } catch (error) {
              console.error(`Error processing ${url}:`, error);
              return {
                summary: "Processing failed.",
                url,
              };
            }
          }),
        );

        writeProgress({
          title: "Aggregating Insights",
          content:
            "Merging all the summaries into a coherent, accurate answer.",
        });

        const webSearchResults = combinedResults.map((result, index) => ({
          ...transformedGoogleResults[index],
          pageSummary: result.summary,
        }));

        return JSON.stringify(webSearchResults);
      } catch (error) {
        throw error;
      }
    },
    strict: true,
  },
});
