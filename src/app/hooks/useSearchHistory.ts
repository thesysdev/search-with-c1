"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UIActions, UIState } from "./useUIState";

const SESSION_STORAGE_KEY = "search-history";
const MAX_HISTORY_LENGTH = 10;
const TTL = 60 * 60 * 1000; // 1 hour in milliseconds

type SearchEntry = {
  query: string;
  response: Omit<UIState, "query" | "isError" | "isLoading">;
  timestamp: number;
};

export const useSearchHistory = (actions: UIActions) => {
  const [history, setHistory] = useState<SearchEntry[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const savedHistory = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedHistory) {
      const parsedHistory: SearchEntry[] = JSON.parse(savedHistory);
      const now = Date.now();
      const freshHistory = parsedHistory.filter(
        (entry) => entry.timestamp && now - entry.timestamp < TTL
      );
      if (freshHistory.length !== parsedHistory.length) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(freshHistory));
      }
      setHistory(freshHistory);
    }
  }, []);

  const updateSearchParams = (query: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("q", encodeURIComponent(query));
    router.push(`${pathname}?${params.toString()}`);
  };

  const addSearchToHistory = (
    query: string,
    response: Omit<UIState, "query" | "isError" | "isLoading">
  ) => {
    const newEntry: SearchEntry = { query, response, timestamp: Date.now() };
    const savedHistory = sessionStorage.getItem(SESSION_STORAGE_KEY);
    let updatedHistory: SearchEntry[] = savedHistory
      ? JSON.parse(savedHistory)
      : [];

    const now = Date.now();
    updatedHistory = updatedHistory.filter(
      (entry) => entry.timestamp && now - entry.timestamp < TTL
    );

    updatedHistory.push(newEntry);

    if (updatedHistory.length > MAX_HISTORY_LENGTH) {
      updatedHistory = updatedHistory.slice(
        updatedHistory.length - MAX_HISTORY_LENGTH
      );
    }
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedHistory));
    setHistory(updatedHistory);

    updateSearchParams(query);

    return newEntry;
  };

  const loadQueryFromHistory = (query: string) => {
    const savedHistory = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (savedHistory) {
      const history: SearchEntry[] = JSON.parse(savedHistory);
      const historyEntry = history.find((entry: SearchEntry) => entry.query === query);
      if (historyEntry) {
        actions.setQuery(historyEntry.query);
        actions.setC1Response(historyEntry.response.c1Response);
        updateSearchParams(historyEntry.query);
      }
      return historyEntry;
    }
    return null;
  };

  return {
    history,
    addSearchToHistory,
    loadQueryFromHistory,
    currentQuery: decodeURIComponent(searchParams.get("q") || ""),
    updateSearchParams,
  };
};
