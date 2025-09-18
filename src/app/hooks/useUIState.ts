import { useState, Dispatch, SetStateAction, useRef } from "react";

import { SearchProvider } from "../api/types/searchProvider";
import { makeApiCall, ApiCallResponse } from "../utils/api";

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
  /** Whether it is the initial search */
  initialSearch: boolean;
  /** The currently selected search provider */
  searchProvider: SearchProvider;
};

export type UIActions = {
  setQuery: Dispatch<SetStateAction<string>>;
  setC1Response: Dispatch<SetStateAction<string>>;
  setSearchProvider: Dispatch<SetStateAction<SearchProvider>>;
  setInitialSearch: (isInitialSearch: boolean) => void;
  makeApiCall: (
    searchQuery: string,
    threadId?: string,
  ) => Promise<ApiCallResponse>;
  abortController: AbortController | null;
  resetState: () => void;
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
  // State for tracking if it is the initial search
  const initialSearch = useRef(true);
  // State for the selected search provider
  const [searchProvider, setSearchProvider] = useState<SearchProvider>(
    SearchProvider.EXA,
  );

  /**
   * Wrapper function around makeApiCall that provides necessary state handlers.
   * This keeps the component interface simple while handling all state management internally.
   */
  const handleApiCall = async (
    searchQuery: string,
    threadId?: string,
  ): Promise<ApiCallResponse> => {
    setC1Response("");
    const result = await makeApiCall({
      searchQuery,
      threadId,
      searchProvider,
      numResults: searchProvider === SearchProvider.EXA ? 5 : undefined,
      setC1Response,
      setIsLoading,
      abortController,
      setAbortController,
    });

    return result;
  };

  const resetState = () => {
    setQuery("");
    setC1Response("");
    setIsLoading(false);
    initialSearch.current = true;
    setAbortController(null);
    setSearchProvider(SearchProvider.EXA);
  };

  return {
    state: {
      query,
      c1Response,
      isLoading,
      initialSearch: initialSearch.current,
      searchProvider,
    },
    actions: {
      setQuery,
      setC1Response,
      setSearchProvider,
      makeApiCall: handleApiCall,
      abortController,
      resetState,
      setInitialSearch: (isInitialSearch: boolean) => {
        initialSearch.current = isInitialSearch;
      },
    },
  };
};
