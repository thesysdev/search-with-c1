"use server";

import { NextRequest, NextResponse } from "next/server";

import { googleWebSearch } from "../../services/googleWebSearch";
import { GoogleWebSearchRequest } from "../../types/search";

/**
 * API endpoint for Google web search.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate the request body
    const searchRequest: GoogleWebSearchRequest = {
      query: body.query,
      num: body.num || 10,
      cr: body.cr,
      gl: body.gl,
      siteSearch: body.siteSearch,
      exactTerms: body.exactTerms,
      dateRestrict: body.dateRestrict,
    };

    // Validate required fields
    if (!searchRequest.query || typeof searchRequest.query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 },
      );
    }

    // Call the Google Web Search service
    const response = await googleWebSearch(searchRequest);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in web search endpoint:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
