"use server";

import { GoogleGenAI, Content } from "@google/genai";

import { ThreadMessage } from "../cache/threadCache";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string,
});

export const googleGenAISearch = async (
  query: string,
  threadHistory: ThreadMessage[],
  writeProgress: (progress: { title: string; content: string }) => void,
) => {
  try {
    writeProgress({
      title: "Processing Query",
      content: `Analyzing your request and searching for relevant information: "${query}"`,
    });

    const contents: Content[] = threadHistory.map((message) => {
      if (message.role === "user") {
        return {
          role: "user",
          parts: [{ text: message.prompt }],
        };
      } else {
        return {
          role: "model",
          parts: [
            {
              text: message.c1Response || "",
            },
          ],
        };
      }
    });

    contents.push({
      role: "user",
      parts: [{ text: query }],
    });

    const streamingResponse = await genAI.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
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
              title,
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
    console.error("Error in Google GenAI API call:", error);

    const errorTitle = "Search Error";
    const errorDescription =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while searching for information.";

    writeProgress({
      title: errorTitle,
      content: errorDescription,
    });

    throw new Error(
      `I encountered an error while searching: ${errorDescription}. Please try again or rephrase your query.`,
    );
  }
};
