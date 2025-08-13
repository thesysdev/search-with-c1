"use client";

import {
  GoogleWebSearchRequest,
  GoogleWebSearchResponse,
} from "../api/types/search";

/**
 * Client-side function to call the web search API endpoint.
 */
export async function webSearch(
  params: GoogleWebSearchRequest,
): Promise<GoogleWebSearchResponse> {
  const response = await fetch("/api/search/web", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`,
    );
  }

  return response.json();
}

/**
 * Client-side function to call the image search API endpoint.
 */
export async function imageSearch(query: string) {
  const response = await fetch("/api/search/image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`,
    );
  }

  return response.json();
}
