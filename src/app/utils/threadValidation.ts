import { validateThread } from "./api";

export type ThreadValidationResult = {
  shouldUseExisting: boolean;
  threadId: string;
  reason: "exists" | "expired" | "validation_failed";
};

/**
 * Validates an existing thread and determines whether to use it or create a new one
 * @param threadIdParam - The thread ID from URL parameters
 * @returns Promise<ThreadValidationResult> - Result indicating what action to take
 */
export const validateAndDecideThread = async (
  threadIdParam: string,
): Promise<ThreadValidationResult> => {
  try {
    const validation = await validateThread(threadIdParam);

    if (validation.exists) {
      return {
        shouldUseExisting: true,
        threadId: threadIdParam,
        reason: "exists",
      };
    } else {
      return {
        shouldUseExisting: false,
        threadId: "", // Let caller generate new UUID
        reason: "expired",
      };
    }
  } catch (error) {
    console.warn("Thread validation failed, will generate new thread:", error);
    return {
      shouldUseExisting: false,
      threadId: "", // Let caller generate new UUID
      reason: "validation_failed",
    };
  }
};

/**
 * Handles initial thread validation and search execution on page load
 * @param currentQuery - The query from URL parameters
 * @param threadIdParam - The thread ID from URL parameters
 * @param hasValidated - Ref to track if validation has already been performed
 * @param isLoading - Current loading state
 * @param performSearch - Function to execute search
 * @returns Promise<void>
 */
export const handleInitialThreadValidation = async (
  currentQuery: string,
  threadIdParam: string,
  hasValidated: React.MutableRefObject<boolean>,
  isLoading: boolean,
  performSearch: (query: string, generateThreadId: boolean) => Promise<void>,
): Promise<void> => {
  // Only validate if we have both query and threadId, haven't validated yet, and not currently loading
  if (!currentQuery || !threadIdParam || hasValidated.current || isLoading) {
    return;
  }

  hasValidated.current = true;

  try {
    const validation = await validateThread(threadIdParam);

    if (!validation.exists) {
      console.log(
        `Initial thread ${threadIdParam} expired, creating new thread and performing search`,
      );
      await performSearch(currentQuery, true);
    } else {
      console.log(
        `Initial thread ${threadIdParam} exists, performing search with existing thread`,
      );
      await performSearch(currentQuery, false);
    }
  } catch (error) {
    console.warn(
      "Initial thread validation failed, creating new thread:",
      error,
    );
    await performSearch(currentQuery, true);
  }
};
