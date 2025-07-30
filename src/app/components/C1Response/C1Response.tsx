"use client";

import React, { useCallback } from "react";
import { C1Component } from "@thesysai/genui-sdk";
import styles from "./C1Response.module.scss";
import { searchImage } from "@/app/api/image_search/searchImage";
import { UIActions, UIState } from "@/app/hooks/useUIState";
import { useSearchHistory } from "@/app/hooks/useSearchHistory";

interface C1ResponseProps extends UIActions, UIState {
  className?: string;
}

export const C1Response = ({
  isLoading,
  c1Response,
  query,
  setC1Response,
  setQuery,
  makeApiCall,
  className,
}: C1ResponseProps) => {
  const { addSearchToHistory, loadQueryFromHistory, updateSearchParams } =
    useSearchHistory({
      setQuery,
      setC1Response,
      makeApiCall,
    });

  const handleSearch = useCallback(async ({
    llmFriendlyMessage,
    humanFriendlyMessage,
  }: {
    llmFriendlyMessage: string;
    humanFriendlyMessage: string;
  }) => {
    if (
      llmFriendlyMessage.length > 0 &&
      humanFriendlyMessage.length > 0 &&
      !isLoading
    ) {
      const existingSearch = loadQueryFromHistory(humanFriendlyMessage);
      if (existingSearch) return;

      updateSearchParams(humanFriendlyMessage);
      setQuery(humanFriendlyMessage);
      const response = await makeApiCall(llmFriendlyMessage, c1Response);
      addSearchToHistory(humanFriendlyMessage, {
        c1Response: response.c1Response,
      });
    }
  }, [isLoading, loadQueryFromHistory, addSearchToHistory, updateSearchParams, setQuery, makeApiCall]);

  return (
    <div className={`${styles.c1Container} mb-4 mt-0 ${className || ""}`}>
      <C1Component
        key={query}
        c1Response={c1Response}
        isStreaming={isLoading}
        updateMessage={setC1Response}
        onAction={handleSearch}
        // @ts-ignore
        searchImage={async (query) => {
          return await searchImage(query);
        }}
      />
    </div>
  );
};
