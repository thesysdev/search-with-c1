import axios from 'axios';

const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.GOOGLE_CX_KEY;

export interface GoogleCustomSearchRequest {
  query: string;
  num?: number; // Number of results to return (1–10). Default is 10.
  cr?: string; // Restrict results by country (e.g. `countryIN` for India).
  gl?: string; // Geolocation of the user to influence search results (e.g. `us`, `in`).
  siteSearch?: string; // Restrict results to a specific site (e.g. `example.com`).
  exactTerms?: string; // Return results that contain this exact phrase.
  dateRestrict?: string; // Restrict results to a specific date range.
}

// Type for a single search result item
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

// The main API response 
export type GoogleCustomSearchResponse = {
  kind: string;
  url?: {
    type: string;
    template: string;
  };
  items: GoogleCustomSearchResponseItem[];
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
 * Calls Google Custom Search API with the given query.
 * @param params GoogleCustomSearchRequest
 * @returns GoogleCustomSearchResponse
 */
export async function googleCustomSearch(
  params: GoogleCustomSearchRequest
): Promise<GoogleCustomSearchResponse> {
  const { 
    query, 
    num,
    cr,
    gl,
    siteSearch,
    exactTerms,
    dateRestrict,
  } = params;
  
  const url = 'https://www.googleapis.com/customsearch/v1';
  const response = await axios.get<GoogleCustomSearchResponse>(url, {
    params: {
      key: apiKey,
      cx,
      q: query,
      num: num || 10,
      cr,
      gl,
      siteSearch,
      exactTerms,
      dateRestrict,
    },
  });
  return response.data;
}
