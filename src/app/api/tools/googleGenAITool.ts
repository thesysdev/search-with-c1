import { GoogleGenAI } from "@google/genai";
import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import { createToolErrorMessage } from "./toolErrorHandler";
import { addCitations } from "./utils/addCitation";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
});

export const googleGenAITool = (
  writeProgress: (progress: { title: string; content: string }) => void,
): RunnableToolFunctionWithParse<{
  query: string;
}> => ({
  type: "function",
  function: {
    name: "google_genai_search",
    description:
      "Performs a real-time web search using Google's grounded generation model. \
        Use this tool when you need the most current information from the internet that may not be available in your existing data,\
        such as breaking news, recent articles, product updates, or the latest documentation.",
    parse: JSON.parse,
    parameters: zodToJsonSchema(
      z.object({
        query: z.string().describe("The search query to look up"),
      }),
    ) as JSONSchema,
    function: async ({ query }: { query: string }) => {
      try {
        writeProgress({
          title: "Initiating Web Search",
          content: `Finding the most relevant pages for: ${JSON.stringify(
            query,
          )}`,
        });

        const response = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: query,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        writeProgress({
          title: "Aggregating Insights",
          content:
            "Merging all the summaries into a coherent, accurate answer.",
        });

        return addCitations(response);
      } catch (error) {
        const errorMessage = createToolErrorMessage(error, {
          action: "performing a web search",
          userFriendlyContext: `for the query: "${query}"`,
        });
        return errorMessage;
      }
    },
    strict: true,
  },
});
