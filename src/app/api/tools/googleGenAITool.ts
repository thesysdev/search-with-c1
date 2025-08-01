import { GoogleGenAI } from "@google/genai";
import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { createToolErrorMessage } from "./toolErrorHandler";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
});

const processResponse = (response: any) => {
  const text = response.text;
  const citations: { uri: string; title: string }[] =
    response.candidates?.[0]?.groundingMetadata?.groundingChunks.map(
      (chunk: any) => chunk.web,
    );

  return {
    text,
    citations,
  };
};

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

        return processResponse(response);
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
