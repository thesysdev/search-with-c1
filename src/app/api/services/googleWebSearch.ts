import axios from "axios";

import {
  GoogleWebSearchRequest,
  GoogleWebSearchResponse,
} from "../types/search";

const apiKey = process.env.GOOGLE_API_KEY;
const cx = process.env.GOOGLE_CX_KEY;

/**
 * Calls Google Custom Search API with the given query for web results.
 * @param params GoogleWebSearchRequest
 * @returns GoogleWebSearchResponse
 */
export async function googleWebSearch(
  params: GoogleWebSearchRequest,
): Promise<GoogleWebSearchResponse> {
  const {
    query,
    num = 10,
    cr,
    gl,
    siteSearch,
    exactTerms,
    dateRestrict,
  } = params;

  const url = "https://www.googleapis.com/customsearch/v1";
  const response = await axios.get<GoogleWebSearchResponse>(url, {
    params: {
      key: apiKey,
      cx,
      q: query,
      num,
      cr,
      gl,
      siteSearch,
      exactTerms,
      dateRestrict,
    },
  });
  return response.data;
}
