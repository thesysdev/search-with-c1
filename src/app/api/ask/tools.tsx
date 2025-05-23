import { googleWebSearchTool } from "../web_search/google_search_tool";
import { imageTool } from "../image_search/google_image_search_tool";

export const tools = (
  writeProgress: (progress: { title: string; content: string }) => void
) => [googleWebSearchTool(writeProgress), imageTool(writeProgress)];
