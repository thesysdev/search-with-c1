/**
 * Type definition for parameters required by the makeApiCall function.
 * This includes both the API request parameters and state management callbacks.
 */
export type ApiCallParams = {
  /** The search query to be sent to the API */
  searchQuery: string;
  /** Callback to update the response state */
  setC1Response: (response: string) => void;
  /** Callback to update the loading state */
  setIsLoading: (isLoading: boolean) => void;
  /** Current abort controller for cancelling ongoing requests */
  abortController: AbortController | null;
  /** Callback to update the abort controller state */
  setAbortController: (controller: AbortController | null) => void;
  /** The ID of the thread to associate with the API call */
  threadId?: string;
};

/**
 * Response type for the makeApiCall function
 */
export type ApiCallResponse = {
  c1Response?: string;
  aborted: boolean;
  error?: string;
  threadId?: string;
  threadStatus?: "new" | "existing";
};

/**
 * Response type for thread validation
 */
export type ThreadValidationResponse = {
  exists: boolean;
  threadId: string;
  messageCount?: number;
};

/**
 * Validates if a thread exists in the backend cache.
 * @param threadId - The thread ID to validate
 * @returns Promise<ThreadValidationResponse> - Object containing validation result
 */
export const validateThread = async (
  threadId: string,
): Promise<ThreadValidationResponse> => {
  try {
    const response = await fetch("/api/validate-thread", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ threadId }),
    });

    if (!response.ok) {
      throw new Error(`Thread validation failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error validating thread:", error);
    return {
      exists: false,
      threadId,
    };
  }
};

/**
 * Makes an API call to the /api/ask endpoint with streaming response handling.
 * Supports request cancellation and manages loading states.
 *
 * @param params - Object containing all necessary parameters and callbacks
 * @returns Promise<ApiCallResponse> - Object containing response data and status
 */
export const makeApiCall = async ({
  searchQuery,
  threadId,
  setC1Response,
  setIsLoading,
  abortController,
  setAbortController,
}: ApiCallParams): Promise<ApiCallResponse> => {
  try {
    // Cancel any ongoing request before starting a new one
    if (abortController) {
      abortController.abort();
    }

    // Create and set up a new abort controller for this request
    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    setIsLoading(true);

    // Make the API request with the abort signal
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: searchQuery,
        threadId,
      }),
      signal: newAbortController.signal,
    });

    // Extract thread information from headers
    const responseThreadId = response.headers.get("X-Thread-Id") || undefined;
    const threadStatus = response.headers.get("X-Thread-Status") as
      | "new"
      | "existing"
      | undefined;

    // Set up stream reading utilities
    const decoder = new TextDecoder();
    const stream = response.body?.getReader();

    if (!stream) {
      throw new Error("response.body not found");
    }

    // Initialize accumulator for streamed response
    let streamResponse = "";

    // Read the stream chunk by chunk
    while (true) {
      const { done, value } = await stream.read();
      // Decode the chunk, considering if it's the final chunk
      const chunk = decoder.decode(value, { stream: !done });

      // Accumulate response and update state
      streamResponse += chunk;
      setC1Response(streamResponse);

      // Break the loop when stream is complete
      if (done) {
        break;
      }
    }

    // Return successful response
    return {
      c1Response: streamResponse,
      aborted: false,
      threadId: responseThreadId,
      threadStatus,
    };
  } catch (error) {
    // Handle abort errors gracefully
    if (error instanceof Error && error.name === "AbortError") {
      console.log("Request was aborted");
      return {
        aborted: true,
      };
    } else {
      console.error("Error in makeApiCall:", error);
      return {
        aborted: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  } finally {
    // Clean up: reset loading state and abort controller
    setIsLoading(false);
    setAbortController(null);
  }
};
