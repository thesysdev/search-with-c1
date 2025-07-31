"use client";

import { useCallback } from "react";
import { useSharedUIState } from "../context/UIStateContext";
import { useSearchHistory } from "./useSearchHistory";

export const useSearchHandler = () => {
  const { state, actions } = useSharedUIState();
  const { addSearchToHistory, loadQueryFromHistory, updateSearchParams } =
    useSearchHistory();

  const handleSearch = useCallback(
    async (query: string) => {
      if (query.length > 0 && !state.isLoading) {
        const existingSearch = loadQueryFromHistory(query);
        if (existingSearch) return;

        updateSearchParams(query);
        actions.setQuery(query);
        const response = await actions.makeApiCall(query);
        addSearchToHistory(query, {
          c1Response: response.c1Response,
        });
      }
    },
    [
      state.isLoading,
      loadQueryFromHistory,
      addSearchToHistory,
      updateSearchParams,
      actions,
    ],
  );

  const handleC1Action = useCallback(
    async ({
      llmFriendlyMessage,
      humanFriendlyMessage,
    }: {
      llmFriendlyMessage: string;
      humanFriendlyMessage: string;
    }) => {
      if (
        llmFriendlyMessage.length > 0 &&
        humanFriendlyMessage.length > 0 &&
        !state.isLoading
      ) {
        updateSearchParams(humanFriendlyMessage);

        const existingSearch = loadQueryFromHistory(humanFriendlyMessage);
        if (existingSearch) return;

        actions.setQuery(humanFriendlyMessage);
        const response = await actions.makeApiCall(
          llmFriendlyMessage,
          state.c1Response,
        );
        addSearchToHistory(humanFriendlyMessage, {
          c1Response: response.c1Response,
        });
      }
    },
    [
      state.isLoading,
      loadQueryFromHistory,
      addSearchToHistory,
      updateSearchParams,
      actions,
      state.c1Response,
    ],
  );

  return { handleSearch, handleC1Action };
};
