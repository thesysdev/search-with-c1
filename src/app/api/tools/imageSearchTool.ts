import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

import { googleImageSearch } from "../services/googleSearch";

import { createToolErrorMessage } from "./toolErrorHandler";

/**
 * Creates a Google image search tool for OpenAI
 * @param writeProgress Callback to write progress updates
 * @returns A runnable tool function for OpenAI
 */
export const imageTool = (
  writeProgress: (progress: { title: string; content: string }) => void,
): RunnableToolFunctionWithParse<{
  altText: string[];
}> => ({
  type: "function",
  function: {
    name: "imageSearch",
    description:
      "ONLY USE THIS TOOL IF YOU ARE LOOKING FOR IMAGES. DO NOT GENERATE IMAGE URLS ON YOUR OWN AND USE THIS TOOL." +
      "\n\n" +
      "Search for and retrieve image URLs based on an array of descriptive texts. " +
      "The function returns both a direct image URL (imageUrl) and a thumbnail URL (thumbnailUrl) for each description." +
      "\n\n" +
      "If you are using a LIST_COMPONENT, use the thumbnailUrl for displaying images in the list. In all other cases, use imageUrl by default." +
      "\n\n" +
      'Example: ["A photo of a cat", "A photo of a dog"]',
    parse: JSON.parse,
    parameters: zodToJsonSchema(
      z.object({
        altText: z
          .array(z.string())
          .describe("An array of alt texts for the images"),
      }),
    ) as JSONSchema,
    function: async ({ altText }: { altText: string[] }) => {
      writeProgress({
        title: "Using Google Image Search Tool",
        content: `Searching for: ${JSON.stringify(altText.join(", "))}`,
      });
      try {
        const results = await Promise.all(
          altText.map(async (text) => {
            const response = await googleImageSearch({
              query: text,
              num: 1,
            });

            if (!response.items || response.items.length === 0) {
              return { altText: text, imageUrl: null, thumbnailUrl: null };
            }

            const images = response.items.map((item) => {
              return {
                altText: item.title,
                imageUrl: item.link,
                thumbnailUrl: item.image?.thumbnailLink || null,
              };
            });

            return images;
          }),
        );

        return JSON.stringify(results);
      } catch (error) {
        console.error("Error in image tool:", error);
        const errorMessage = createToolErrorMessage(error, {
          action: "searching for images",
          userFriendlyContext: `for the following images: ${altText.join(
            ", ",
          )}`,
        });
        return errorMessage;
      }
    },
    strict: true,
  },
});
