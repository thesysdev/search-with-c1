/**
 * Re-export API functions for backward compatibility
 */
export { googleImageSearch } from '../services/googleSearch';
export type {
  GoogleImageSearchRequest,
  GoogleImageSearchResponse,
  GoogleImageSearchResponseItem
} from '../types/search';

// Re-export tools
export { imageTool } from '../tools/imageSearchTool'; 