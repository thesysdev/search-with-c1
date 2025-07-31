/**
 * Utility functions for handling tool errors gracefully
 * This ensures the LLM receives helpful error messages instead of crashes
 */

export interface ToolErrorOptions {
  action: string;
  userFriendlyContext?: string;
  technicalDetails?: boolean;
  suggestion?: string;
}

/**
 * Creates a graceful error message for tool failures
 * @param error - The error that occurred
 * @param options - Configuration for the error message
 * @returns A user-friendly error message for the LLM
 */
export function createToolErrorMessage(
  error: unknown,
  options: ToolErrorOptions,
): string {
  const {
    action,
    userFriendlyContext,
    technicalDetails = false,
    suggestion,
  } = options;

  let errorMessage = "Unknown error occurred";

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  }

  const baseMessage = `I apologize, but I encountered an error while ${action}`;
  const context = userFriendlyContext ? ` ${userFriendlyContext}` : "";
  const details = technicalDetails ? ` (${errorMessage})` : "";
  const finalSuggestion = getSuggestionForError(errorMessage, suggestion);

  return `${baseMessage}${context}${details}. ${finalSuggestion}`;
}

/**
 * Provides contextual suggestions based on the error type
 * Fallback suggestions when tool doesn't provide its own
 */
function getSuggestionForError(
  errorMessage: string,
  suggestion: string | undefined,
): string {
  const lowerError = errorMessage.toLowerCase();

  // Network-related errors
  if (
    lowerError.includes("network") ||
    lowerError.includes("connection") ||
    lowerError.includes("timeout")
  ) {
    return "Please check your internet connection and try again later.";
  }

  // API key or authentication errors
  if (
    lowerError.includes("api key") ||
    lowerError.includes("unauthorized") ||
    lowerError.includes("403")
  ) {
    return "Please contact your administrator to check the API configuration.";
  }

  // Rate limiting errors
  if (lowerError.includes("rate limit") || lowerError.includes("429")) {
    return "The service is temporarily unavailable due to rate limiting. Please try again in a few minutes.";
  }

  // Generic fallback
  return (
    suggestion ||
    "Please try again later or contact your administrator if the issue persists."
  );
}
