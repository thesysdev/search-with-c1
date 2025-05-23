import { googleWebSearchTool } from "./webSearchTool";
import { imageTool } from "./imageSearchTool";

/**
 * Returns an array of all available tools for the OpenAI API
 * @param writeProgress Callback to write progress updates
 * @returns Array of runnable tool functions
 */
export const getTools = (
  writeProgress: (progress: { title: string; content: string }) => void
) => [
  googleWebSearchTool(writeProgress),
  imageTool(writeProgress)
]; 