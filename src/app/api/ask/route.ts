"use server";

import { makeC1Response } from "@thesysai/genui-sdk/server";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { callGoogleGenAI } from "../utils/api";
import { transformStream } from "@crayonai/stream";
import { SYSTEM_PROMPT } from "./systemPrompt";

const client = new OpenAI({
  baseURL: "https://api.dev.thesys.dev/v1/visualize",
  apiKey: process.env.THESYS_API_KEY,
});

/**
 * API route handler for ask endpoint
 * @param req The NextRequest object
 * @returns A streaming response
 */
export async function POST(req: NextRequest) {
  const c1Response = makeC1Response();

  try {
    // Check if request is already aborted
    if (req.signal.aborted) {
      return new Response("Request aborted", { status: 499 });
    }

    const { prompt, previousC1Response } = (await req.json()) as {
      prompt: string;
      previousC1Response?: string;
    };

    const generateResponse = async () => {
      const geminiResponse = await callGoogleGenAI(prompt, (progress) => {
        // Check if request is aborted before writing progress
        if (req.signal.aborted) return;
  
        c1Response.writeThinkItem({
          title: progress.title,
          description: progress.content,
        });
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
  
      const llmStream = await client.chat.completions.create({
        model: "c1-nightly",
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          ...messages,
          {
            role: "assistant",
            content: `Here is the response from the web search: ${JSON.stringify(
              geminiResponse,
            )}`,
          },
        ],
        stream: true,
      });
      
      transformStream(
        llmStream,
        (chunk) => {
          // Check if request is aborted before processing chunk
          if (req.signal.aborted) return "";
  
          const contentDelta = chunk.choices[0]?.delta?.content || "";
  
          if (contentDelta) {
            try {
              c1Response.writeContent(contentDelta);
            } catch (error) {
              // Ignore write errors if stream is aborted
              if (!req.signal.aborted) {
                console.error("Error writing content:", error);
              }
            }
          }
          return contentDelta;
        },
        {
          onEnd: () => {
            try {
              if (!req.signal.aborted) {
                c1Response.end();
              }
            } catch (error) {
              console.error("Stream already closed:", error);
            }
          },
        },
      );
    }

    generateResponse();

    return new Response(c1Response.responseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    // Handle abort errors gracefully
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"))
    ) {
      console.log("Request aborted");
      try {
        c1Response.end();
      } catch {
        // Ignore errors when ending aborted response
      }
      return new Response("Request aborted", { status: 499 });
    }

    console.error("Error in POST handler:", error);
    try {
      c1Response.end();
    } catch {
      // Ignore errors when ending error response
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
