"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { useSearchHistory } from "./useSearchHistory";
import { UIActions, UIState } from "./useUIState";

export const useSearchHandler = (
  state: UIState,
  actions: UIActions,
): {
  currentQuery: string;
  handleSearch: (query: string) => Promise<void>;
  handleC1Action: ({
    llmFriendlyMessage,
    humanFriendlyMessage,
  }: {
    llmFriendlyMessage: string;
    humanFriendlyMessage: string;
  }) => Promise<void>;
  refetchQueryResponse: (query: string) => Promise<void>;
} => {
  const searchParams = useSearchParams();
  const isSearching = useRef(false);

  const currentQuery = useMemo(() => {
    const query = decodeURIComponent(searchParams.get("q") || "");
    if (query.length) actions.setInitialSearch(false);
    return query;
  }, [searchParams, actions]);

  const {
    addSearchToHistory,
    loadQueryFromHistory,
    updateSearchParams,
    removeQueryFromHistory,
  } = useSearchHistory(currentQuery, actions);

  const performSearch = useCallback(
    async (
      displayQuery: string,
      apiQuery: string,
      previousC1Response?: string,
    ) => {
      if (displayQuery.length === 0 || state.isLoading) {
        return;
      }

      isSearching.current = true;

      actions.setInitialSearch(false);

      const existingSearch = loadQueryFromHistory(displayQuery);
      if (existingSearch) {
        isSearching.current = false;
        return;
      }

      updateSearchParams(displayQuery);
      actions.setQuery(displayQuery);

      try {
        const response = await actions.makeApiCall(
          apiQuery,
          previousC1Response,
        );

        if (response.aborted) {
          console.log("Request was aborted, not updating history");
          return;
        }

        if (response.c1Response) {
          addSearchToHistory(displayQuery, {
            c1Response: response.c1Response,
            initialSearch: false,
          });
        } else if (response.error) {
          console.error("API call failed:", response.error);
          removeQueryFromHistory(displayQuery);
        }
      } catch (error) {
        console.error("Unexpected error in makeApiCall:", error);
        removeQueryFromHistory(displayQuery);
      } finally {
        isSearching.current = false;
      }
    },
    [
      state.isLoading,
      loadQueryFromHistory,
      addSearchToHistory,
      updateSearchParams,
      actions,
      removeQueryFromHistory,
    ],
  );

  const handleSearch = useCallback(
    async (query: string) => {
      await performSearch(query, query);
    },
    [performSearch],
  );

  const handleC1Action = useCallback(
    async ({
      llmFriendlyMessage,
      humanFriendlyMessage,
    }: {
      llmFriendlyMessage: string;
      humanFriendlyMessage: string;
    }) => {
      await performSearch(
        llmFriendlyMessage,
        humanFriendlyMessage,
        state.c1Response,
      );
    },
    [performSearch, state.c1Response],
  );

  const refetchQueryResponse = useCallback(
    async (query: string) => {
      actions.setC1Response("");
      removeQueryFromHistory(query);
      await performSearch(query, query);
    },
    [performSearch, removeQueryFromHistory],
  );

  useEffect(() => {
    if (state.query === currentQuery) {
      return;
    }

    if (state.isLoading && isSearching.current) {
      actions.abortController?.abort();
    }
    const existingSearch = loadQueryFromHistory(currentQuery);

    if (!existingSearch) {
      handleSearch(currentQuery);
    }
  }, [currentQuery]);

  return { currentQuery, handleSearch, handleC1Action, refetchQueryResponse };
};
