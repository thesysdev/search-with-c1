"use client";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

import { isValidC1Response } from "../utils/isValidC1Response";

import { UIActions, UIState } from "./useUIState";

const SESSION_STORAGE_KEY = "search-history";
const MAX_HISTORY_LENGTH = 10;
const TTL = 60 * 60 * 1000; // 1 hour in milliseconds

type SearchEntry = {
  query: string;
  response: Omit<UIState, "query" | "isError" | "isLoading">;
  timestamp: number;
};

export const useSearchHistory = (currentQuery: string, actions: UIActions) => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const savedHistory = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedHistory) {
      const parsedHistory: SearchEntry[] = JSON.parse(savedHistory);
      const now = Date.now();
      const freshHistory = parsedHistory.filter(
        (entry) => entry.timestamp && now - entry.timestamp < TTL,
      );
      if (freshHistory.length !== parsedHistory.length) {
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify(freshHistory),
        );
      }
    }
  }, []);

  const updateSearchParams = useCallback(
    (query: string) => {
      if (query === currentQuery) return;

      const params = new URLSearchParams();
      params.set("q", encodeURIComponent(query));
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, currentQuery],
  );

  const addSearchToHistory = useCallback(
    (query: string, response: Omit<UIState, "query" | "isLoading">) => {
      if (!isValidC1Response(response.c1Response)) {
        return;
      }
      const newEntry: SearchEntry = { query, response, timestamp: Date.now() };
      const savedHistory = sessionStorage.getItem(SESSION_STORAGE_KEY);
      let updatedHistory: SearchEntry[] = savedHistory
        ? JSON.parse(savedHistory)
        : [];

      const now = Date.now();
      updatedHistory = updatedHistory.filter(
        (entry) => entry.timestamp && now - entry.timestamp < TTL,
      );

      const existingEntryIndex = updatedHistory.findIndex(
        (entry) => entry.query === query,
      );

      if (existingEntryIndex > -1) {
        updatedHistory.splice(existingEntryIndex, 1);
      }

      updatedHistory.push(newEntry);

      if (updatedHistory.length > MAX_HISTORY_LENGTH) {
        updatedHistory = updatedHistory.slice(
          updatedHistory.length - MAX_HISTORY_LENGTH,
        );
      }
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(updatedHistory),
      );
    },
    [],
  );

  const removeQueryFromHistory = useCallback((query: string) => {
    const savedHistory = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedHistory) {
      const history: SearchEntry[] = JSON.parse(savedHistory);
      const updatedHistory = history.filter((entry) => entry.query !== query);
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify(updatedHistory),
      );
    }
  }, []);

  const loadQueryFromHistory = useCallback(
    (query: string) => {
      const savedHistory = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (savedHistory) {
        const history: SearchEntry[] = JSON.parse(savedHistory);
        const historyEntry = history.find(
          (entry: SearchEntry) => entry.query === query,
        );
        if (historyEntry) {
          actions.setQuery(historyEntry.query);
          actions.setC1Response(historyEntry.response.c1Response);
          updateSearchParams(historyEntry.query);
        }
        return historyEntry;
      }
      return null;
    },
    [actions, updateSearchParams],
  );

  return {
    addSearchToHistory,
    loadQueryFromHistory,
    updateSearchParams,
    removeQueryFromHistory,
  };
};
