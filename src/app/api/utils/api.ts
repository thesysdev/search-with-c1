"use server";

import { GoogleGenAI } from "@google/genai";

import { createToolErrorMessage } from "../tools/toolErrorHandler";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
});

export const callGoogleGenAI = async (
  query: string,
  writeProgress: (progress: { title: string; content: string }) => void,
) => {
  try {
    writeProgress({
      title: "Processing Query",
      content: `Analyzing your request and searching for relevant information: "${query}"`,
    });

    const streamingResponse = await genAI.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: {
          includeThoughts: true,
        },
      },
    });

    let text = "";
    for await (const chunk of streamingResponse) {
      if (chunk.candidates?.[0]?.content?.parts) {
        for (const part of chunk.candidates[0].content.parts) {
          if (part.thought && part.text) {
            const thoughtText = part.text.trim();
            const lines = thoughtText
              .split("\n")
              .filter((line: string) => line.trim() !== "");
            const title = lines[0]?.replace(/\*\*/g, "") || "Thinking...";
            const content = lines.slice(1).join("\n").trim();

            writeProgress({
              title: title,
              content: content || thoughtText,
            });
          }
        }
      }
      if (chunk.text) {
        text += chunk.text;
      }
    }

    writeProgress({
      title: "Generating Final Answer",
      content: "Compiling the information into a comprehensive response.",
    });

    return text;
  } catch (error) {
    const errorMessage = createToolErrorMessage(error, {
      action: "performing a web search",
      userFriendlyContext: `for the query: "${query}"`,
    });
    return errorMessage;
  }
};

