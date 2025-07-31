"use server";

import { GenerateContentResponse, GoogleGenAI } from "@google/genai";
import axios from "axios";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";

// Types for website content extraction
export interface ExtractWebsiteContentRequest {
  urls: string[];
}

export interface ExtractWebsiteContentResult {
  url: string;
  content: string;
  error?: string;
}

export interface ExtractWebsiteContentResponse {
  results: ExtractWebsiteContentResult[];
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Extracts content from specified websites.
 * @param urls An array of URLs to extract content from
 * @returns ExtractWebsiteContentResponse
 */
export async function extractWebsiteContent(
  urls: string[],
): Promise<ExtractWebsiteContentResponse> {
  try {
    const results: ExtractWebsiteContentResult[] = [];

    const axiosInstance = axios.create({
      timeout: 15000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
      },
    });

    // Process URLs in parallel
    await Promise.all(
      urls.map(async (url) => {
        try {
          // Simple content extraction
          const response = await axiosInstance.get(url);

          // Get html content as string
          const htmlContent = response.data as string;

          const dom = new JSDOM(htmlContent, { url });
          const reader = new Readability(dom.window.document);
          const article = reader.parse();

          results.push({
            url,
            content: article?.textContent || "",
          });
        } catch (error) {
          console.error(`Error extracting content from ${url}:`, error);
          results.push({
            url,
            content: "",
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );

    return { results };
  } catch (error) {
    console.error("Error in extractWebsiteContent:", error);
    throw error;
  }
}

/**
 * Interfaces for content summarization
 */
export interface SummarizeWebsiteContentRequest {
  content: string;
  query: string;
  timeout?: number;
}

/**
 * Uses OpenAI to summarize website content.
 * @param params SummarizeWebsiteContentRequest
 * @returns A string containing the summarized content
 */
export async function summarizeWebsiteContent(
  params: SummarizeWebsiteContentRequest,
): Promise<string> {
  const { content, query, timeout = 15000 } = params;

  if (!content) {
    return "No content available to summarize.";
  }

  const maxContentLength = 500000;
  const truncatedContent =
    content.length > maxContentLength
      ? content.substring(0, maxContentLength) +
        "... [content truncated for performance]"
      : content;

  try {
    const systemPrompt =
      "You are a expert assistant that EXTRACTS and SUMMARIZES website content to answer specific questions. " +
      "Focus only on information related to the user's query. " +
      "If the content doesn't relate to the query, mention that the page doesn't contain relevant information. " +
      "Keep your summary concise, factual, and informative.";

    const userMessage = `
      User Query: ${query || "N/A"}
      Website Content: ${truncatedContent}`;

    const finalPrompt = `${systemPrompt}\n\n${userMessage}`;

    try {
      // Create the actual summarization promise
      const summarizationPromise = ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: finalPrompt,
      });

      // Race the promises to implement timeout
      const result = (await summarizationPromise) as GenerateContentResponse;

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      return text?.trim() || "";
    } catch (error) {
      console.error("Error during website summarization:", error);
      if ((error as Error).message === "Summarization timed out") {
        return "Summarization timed out. Please try again with less content or a longer timeout.";
      }
      return "Failed to summarize website content";
    }
  } catch (error) {
    console.error("Error in summarizeWebsiteContent:", error);
    return "Error summarizing content.";
  }
}
