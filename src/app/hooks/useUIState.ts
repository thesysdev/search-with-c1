import { useState, Dispatch, SetStateAction } from "react";
import { makeApiCall } from "../utils/api";
import {
  TransformedWebResult,
  TransformedImageResult,
} from "../api/types/search";

/**
 * Type definition for the UI state.
 * Contains all the state variables needed for the application's UI.
 */
export type UIState = {
  /** The current search query input */
  query: string;
  /** The current response from the C1 API */
  c1Response: string;
  /** Whether an API request is currently in progress */
  isLoading: boolean;
};

export type UIActions = {
  setQuery: Dispatch<SetStateAction<string>>;
  setC1Response: Dispatch<SetStateAction<string>>;
  makeApiCall: (
    searchQuery: string,
    previousC1Response?: string,
  ) => Promise<{ c1Response: string }>;
};

export const useUIState = (): { state: UIState; actions: UIActions } => {
  const [query, setQuery] = useState("");
  // State for storing the API response
  const [c1Response, setC1Response] = useState("");
  // State for tracking if a request is in progress
  const [isLoading, setIsLoading] = useState(false);
  // State for managing request cancellation
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  /**
   * Wrapper function around makeApiCall that provides necessary state handlers.
   * This keeps the component interface simple while handling all state management internally.
   */
  const handleApiCall = async (searchQuery: string) => {
    let finalResponse = "";
    const responseSetter = (response: string) => {
      finalResponse = response;
      setC1Response(response);
    };

    setC1Response("");
    await makeApiCall({
      searchQuery,
      setC1Response: responseSetter,
      setIsLoading,
      abortController,
      setAbortController,
    });
    return { c1Response: finalResponse };
  };

  return {
    state: {
      query,
      c1Response,
      isLoading,
    },
    actions: {
      setQuery,
      setC1Response,
      makeApiCall: handleApiCall,
    },
  };
};
