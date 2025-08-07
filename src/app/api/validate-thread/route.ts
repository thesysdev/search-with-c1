"use server";

import { NextRequest, NextResponse } from "next/server";

import { getThread } from "../cache/threadCache";

interface ValidateThreadRequest {
  threadId: string;
}

interface ValidateThreadResponse {
  exists: boolean;
  threadId: string;
  messageCount?: number;
}

/**
 * API route handler for validating thread existence.
 * Checks if a thread exists in cache without performing expensive operations.
 * @param req The NextRequest object.
 * @returns JSON response indicating thread existence status.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse<ValidateThreadResponse>> {
  try {
    const { threadId } = (await req.json()) as ValidateThreadRequest;

    if (!threadId) {
      return NextResponse.json(
        { exists: false, threadId: "" },
        { status: 400 },
      );
    }

    const threadHistory = await getThread(threadId);

    return NextResponse.json({
      exists: threadHistory !== null,
      threadId,
      messageCount: threadHistory?.length || 0,
    });
  } catch (error) {
    console.error("Error validating thread:", error);
    return NextResponse.json({ exists: false, threadId: "" }, { status: 500 });
  }
}
