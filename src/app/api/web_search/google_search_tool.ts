import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  googleCustomSearch,
  GoogleCustomSearchRequest,
  GoogleCustomSearchResponseItem,
} from "./google_cs";
import { summarizeWebsiteContent } from "./website_content_summarizer";
import { extractWebsiteContent } from "./website_content";

type RawGoogleResult = {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    cse_thumbnail?: Array<{ src: string }>;
    cse_image?: Array<{ src: string }>;
  };
};

type TransformedResult = {
  title: string;
  sourceURL: string;
  snippet: string;
  pageSummary: string;
  sourceImage: {
    fullImage?: string;
    thumbnail?: string;
  };
};

function transformGoogleResponse(
  response: GoogleCustomSearchResponseItem[]
): TransformedResult[] {
  if (!response || !Array.isArray(response)) return [];

  return response.map((item: RawGoogleResult) => {
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

// const c1Response = makeC1Response()

export const googleWebSearchTool = (
  writeProgress: (progress: { title: string; content: string }) => void
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
            "Restrict results to a specific site (e.g., 'example.com')"
          ),
        exactTerms: z
          .string()
          .optional()
          .describe("Only return results with this exact phrase"),
        dateRestrict: z
          .string()
          .optional()
          .describe(
            "Limit results by date (e.g., 'd[1]' for past day, 'w[1]' for past week)"
          ),
      })
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
        const params: GoogleCustomSearchRequest = {
          query,
          num: 3,
        };
        if (cr) params.cr = cr;
        if (gl) params.gl = gl;
        if (siteSearch) params.siteSearch = siteSearch;
        if (exactTerms) params.exactTerms = exactTerms;
        if (dateRestrict) params.dateRestrict = dateRestrict;

        writeProgress({
          title: "Using Google Web Search Tool",
          content: "Searching for: " + JSON.stringify(query),
        });

        const googleSearchResponse = await googleCustomSearch(params);

        if (
          !googleSearchResponse.items ||
          googleSearchResponse.items.length === 0
        ) {
          return "No results found";
        }

        const transformedGoogleResults = transformGoogleResponse(
          googleSearchResponse.items
        );
        const sourceURLs = transformedGoogleResults.map(
          (result) => result.sourceURL
        );

        // Process extraction and summarization for each URL in parallel
        const combinedResults = await Promise.all(
          sourceURLs.map(async (url) => {
            try {
              // c1Response.writeThinkItem({
              //   title: 'Extracting content from: ' + url,
              //   description: 'Extracting content from: ' + url,
              //   ephemeral: false,
              // })
              // Step 1: Extract content for this specific URL
              const { results } = await extractWebsiteContent([url]);
              const content = results[0]?.content ?? "";

              // Step 2: Only summarize if we have content
              let summary = "";
              if (content) {
                // c1Response.writeThinkItem({
                //   title: 'Summarizing content',
                //   description: 'Summarizing content',
                //   ephemeral: false,
                // })
                summary = await summarizeWebsiteContent({
                  content,
                  query,
                  timeout: 10000,
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
          })
        );

        writeProgress({
          title: "Combining results",
          content: "Combining results",
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
