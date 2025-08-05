/**
 * Common types for Google Custom Search API requests and responses
 */

// Base request interface for all Google Search requests
interface BaseGoogleSearchRequest {
  query: string;
  num?: number;
  cr?: string; // Country restriction
  gl?: string; // Geolocation
  siteSearch?: string;
  exactTerms?: string;
  dateRestrict?: string;
}

// Image search specific item
interface GoogleImageSearchResponseItem {
  title: string;
  htmlTitle: string;
  link: string;
  displayLink: string;
  snippet: string;
  htmlSnippet: string;
  mime: string;
  fileFormat: string;
  image: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
}

// Base response structure for Google Search API
interface BaseGoogleSearchResponse<T> {
  kind: string;
  url?: {
    type: string;
    template: string;
  };
  items: T[];
  queries: {
    request: Array<{
      [key: string]: string;
    }>;
    nextPage?: Array<{
      [key: string]: string;
    }>;
  };
  context?: {
    title: string;
  };
  searchInformation: {
    searchTime: number;
    formattedSearchTime: string;
    totalResults: string;
    formattedTotalResults: string;
  };
}

// Web search specific request
export interface GoogleWebSearchRequest extends BaseGoogleSearchRequest {}

// Complete response types
export type GoogleWebSearchResponse =
  BaseGoogleSearchResponse<GoogleCustomSearchResponseItem>;
export type GoogleImageSearchResponse =
  BaseGoogleSearchResponse<GoogleImageSearchResponseItem>;

// Web search specific item
export interface GoogleCustomSearchResponseItem {
  title: string;
  htmlTitle: string;
  link: string;
  displayLink: string;
  snippet: string;
  htmlSnippet: string;
  cacheId?: string;
  formattedUrl: string;
  htmlFormattedUrl: string;
  pagemap?: {
    cse_thumbnail?: Array<{
      src: string;
      width: string;
      height: string;
    }>;
    cse_image?: Array<{
      src: string;
    }>;
  };
}
