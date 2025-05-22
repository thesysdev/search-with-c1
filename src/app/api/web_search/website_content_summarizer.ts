import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

interface WebsiteContentSummarizationRequest {
  content: string;
  query?: string;
  timeout?: number; // Optional timeout in milliseconds
}

/**
 * Summarizes website content based on a query using Google's Gemini model
 */
export async function summarizeWebsiteContent(
  req: WebsiteContentSummarizationRequest,
): Promise<string> {
  // Set a default timeout of 5000ms if not provided
  const timeout = req.timeout || 5000;
  
  // Limit content size to improve performance
  const maxContentLength = 500000;
  console.log("## req.content", req.content.length);
  const truncatedContent = req.content.length > maxContentLength 
    ? req.content.substring(0, maxContentLength) + "... [content truncated for performance]" 
    : req.content;

  const systemPrompt = `
You are an expert assistant that EXTRACTS and SUMMARIZES website text content based on the user query. 
Remove only truly irrelevant or unwanted data, but keep all relevant information to the user query. 
Do not skip or omit any critical or contextually important information.
If a user query is provided, make sure the summary directly addresses the query context.
Be brief and concise. Prioritize facts and information directly related to the query.`;

  const userMessage = `
User Query: ${req.query || "N/A"}
Website Content:
${truncatedContent}`;

const combinedPrompt = `${systemPrompt}\n\n${userMessage}`;

  try {
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Summarization timed out")), timeout);
    });
    
    // Create the actual summarization promise
    const summarizationPromise = ai.models.generateContent({
      model: "gemini-1.5-pro",
      contents: combinedPrompt,
    });
    
    // Race the promises to implement timeout
    const result = await Promise.race([
      summarizationPromise,
      timeoutPromise
    ]) as GenerateContentResponse;
    
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || "";
  } catch (error) {
    console.error("Error during website summarization:", error);
    if ((error as Error).message === "Summarization timed out") {
      return "Summarization timed out. Please try again with less content or a longer timeout.";
    }
    return "Failed to summarize website content";
  }
}
