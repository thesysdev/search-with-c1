'use server'

import { NextRequest } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { transformStream } from "@crayonai/stream";
import { getTools } from "../tools";
import { makeC1Response } from "@thesysai/genui-sdk/server";

const client = new OpenAI({
  baseURL: "https://api.thesys.dev/v1/embed",
  apiKey: process.env.THESYS_API_KEY,
});

/**
 * API route handler for ask endpoint
 * @param req The NextRequest object
 * @returns A streaming response
 */
export async function POST(req: NextRequest) {
  const c1Response = makeC1Response();
  const { prompt, previousC1Response } = (await req.json()) as {
    prompt: string;
    previousC1Response?: string;
  };

  c1Response.writeThinkItem({
    title: "Thinking...",
    description: "Diving into the digital depths to craft you an answer",
  });

  const messages: ChatCompletionMessageParam[] = [];

  if (previousC1Response) {
    messages.push({
      role: "assistant",
      content: previousC1Response,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  const tools = getTools((progress) => {
    c1Response.writeThinkItem({
      title: progress.title,
      description: progress.content,
    });
  });

  const runToolsResponse = client.beta.chat.completions.runTools({
    model: "c1-nightly",
    messages: [
      {
        role: "system",
        content: `You can:
- Search and retrieve real-time information from the web
- Answer questions on any topic with up-to-date information
- Summarize articles and web content
- Provide detailed research and analysis
- Explain complex topics in simple terms
- Find latest news, trends, and developments

Today is ${new Date().toLocaleDateString()}.

For each response:
1. Search for relevant and current information from multiple sources and compile them
2. Present information in a clear, organized manner using best ui components
3. Cite sources when providing information with links and source thumnails images with links
4. Try to include images to make the response more engaging using the image tool
5. When using the image tool then try to fetch multiple images and use the IMAGE_GALLERY component
5. Use graphs for showing any data visualizations of any kind (e.g. charts, tables, etc.)

Remember to be helpful, accurate, and comprehensive in your responses while maintaining a conversational tone.`,
      },
      ...messages,
    ],
    stream: true,
    tool_choice: "auto",
    tools,
  });

  const llmStream = await runToolsResponse;

  transformStream(
    llmStream,
    (chunk) => {
      const contentDelta = chunk.choices[0]?.delta?.content || "";

      if (contentDelta) {
        c1Response.writeContent(contentDelta);
      }
      return contentDelta;
    },
    {
      onEnd: () => {
        try {
          c1Response.end();
        } catch (error) {
          console.error("Stream already closed:", error);
        }
      },
    }
  );

  return new Response(c1Response.responseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
} 