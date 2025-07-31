/**
 * Re-export API functions for backward compatibility
 */
export { googleWebSearch as googleCustomSearch } from "../services/googleSearch";
export type {
  GoogleWebSearchRequest as GoogleCustomSearchRequest,
  GoogleWebSearchResponse as GoogleCustomSearchResponse,
  GoogleCustomSearchResponseItem,
} from "../types/search";

// Re-export website content functions
export { extractWebsiteContent } from "../services/websiteContent";
export { summarizeWebsiteContent } from "../services/websiteContent";

// Re-export tools
export { googleWebSearchTool } from "../tools/webSearchTool";
