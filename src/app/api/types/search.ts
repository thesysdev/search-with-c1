/**
 * Common types for Google Custom Search API requests and responses
 */

// Base request interface for all Google Search requests
export interface BaseGoogleSearchRequest {
  query: string;
  num?: number;
  cr?: string; // Country restriction
  gl?: string; // Geolocation
  siteSearch?: string;
  exactTerms?: string;
  dateRestrict?: string;
}

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

// Image search specific item
export interface GoogleImageSearchResponseItem {
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
export interface BaseGoogleSearchResponse<T> {
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

// Image search specific request
export interface GoogleImageSearchRequest extends BaseGoogleSearchRequest {
  start?: number;
  safe?: string;
  imgSize?: string;
  imgType?: string;
  imgColorType?: string;
  imgDominantColor?: string;
}

// Complete response types
export type GoogleWebSearchResponse =
  BaseGoogleSearchResponse<GoogleCustomSearchResponseItem>;
export type GoogleImageSearchResponse =
  BaseGoogleSearchResponse<GoogleImageSearchResponseItem>;

// Transformed result types for web search
export interface TransformedWebResult {
  title: string;
  sourceURL: string;
  snippet: string;
  pageSummary: string;
  sourceImage: {
    fullImage?: string;
    thumbnail?: string;
  };
}

// Transformed result types for image search
export interface TransformedImageResult {
  altText: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
}
