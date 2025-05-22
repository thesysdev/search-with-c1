import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { googleImageSearch } from "./google_image_search";
// import { makeC1Response } from "@thesysai/genui-sdk";

// const c1Response = makeC1Response()

export const imageTool: RunnableToolFunctionWithParse<{
  altText: string[];
}> = {
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
      })
    ) as JSONSchema,
    function: async ({ altText }: { altText: string[] }) => {
      try {
        const results = await Promise.all(
          altText.map(async (text) => {
            // c1Response.writeThinkItem({
            //   title: 'Using Image Search Tool',
            //   description: 'Searching for images for:' + JSON.stringify(text),
            //   ephemeral: false,
            // })
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
          })
        );

        return results;
      } catch (error) {
        console.error("Error in image tool:", error);
        throw error;
      }
    },
    strict: true,
  },
};
