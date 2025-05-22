import axios from 'axios';

const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.GOOGLE_CX_KEY;

export interface GoogleImageSearchRequest {
  query: string;
  num?: number; // Number of results to return. Default is 10.
  start?: number; // Starting index for pagination
  safe?: string; // Safe search level (e.g. 'active', 'off')
  imgSize?: string; // Image size (e.g. 'huge', 'large', 'medium', 'small')
  imgType?: string; // Image type (e.g. 'face', 'photo', 'clipart', 'lineart')
  imgColorType?: string; // Image color type (e.g. 'color', 'gray', 'mono')
  imgDominantColor?: string; // Dominant color in the image
}

// Type for an image search result item
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

// The main API response 
export type GoogleImageSearchResponse = {
  kind: string;
  url?: {
    type: string;
    template: string;
  };
  items: GoogleImageSearchResponseItem[];
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
};

/**
 * Calls Google Custom Search API for image search with the given query.
 * @param params GoogleImageSearchRequest
 * @returns GoogleImageSearchResponse
 */
export async function googleImageSearch(
  params: GoogleImageSearchRequest
): Promise<GoogleImageSearchResponse> {
  const { 
    query, 
    num = 10,
    start = 1,
    safe = 'active',
    imgSize,
    imgType,
    imgColorType,
    imgDominantColor
  } = params;
  
  const axiosInstance = axios.create({
    baseURL: 'https://www.googleapis.com/customsearch/v1',
  });
  
  const response = await axiosInstance.get<GoogleImageSearchResponse>('', {
    params: {
      q: query,
      searchType: 'image',
      key: apiKey,
      cx: cx,
      num: num,
      start: start,
      safe: safe,
      imgSize,
      imgType,
      imgColorType,
      imgDominantColor
    },
  });
  
  return response.data;
}
