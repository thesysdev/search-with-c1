"use server";

import { NextRequest, NextResponse } from "next/server";

import { searchImage } from "../../services/googleImageSearch";

interface ImageSearchRequest {
  query: string;
}

/**
 * API endpoint for Google image search.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate the request body
    const { query }: ImageSearchRequest = body;

    // Validate required fields
    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 },
      );
    }

    // Call the Google Image Search service
    const response = await searchImage(query);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in image search endpoint:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
