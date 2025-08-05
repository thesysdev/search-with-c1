"use client";

import { randomUUID } from "crypto";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { UIActions, UIState } from "./useUIState";

const QUERY_PARAM_THREAD_ID = "tid";
const QUERY_PARAM_QUERY = "q";

export const useSearchHandler = (
  state: UIState,
  actions: UIActions,
): {
  currentQuery: string;
  handleSearch: (query: string) => Promise<void>;
  handleC1Action: (query: string) => Promise<void>;
} => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSearching = useRef(false);

  const currentQuery = useMemo(() => {
    const query = decodeURIComponent(searchParams.get(QUERY_PARAM_QUERY) || "");
    if (query.length) actions.setInitialSearch(false);
    return query;
  }, [searchParams, actions]);

  const updateSearchParams = useCallback(
    (query: string, threadId: string) => {
      if (query === currentQuery) return;

      const params = new URLSearchParams();
      params.set(QUERY_PARAM_QUERY, encodeURIComponent(query));
      params.set(QUERY_PARAM_THREAD_ID, threadId);
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, currentQuery],
  );

  const performSearch = useCallback(
    async (query: string, generateThreadId: boolean) => {
      if (query.length === 0 || state.isLoading) {
        return;
      }

      const threadId = generateThreadId
        ? randomUUID()
        : searchParams.get(QUERY_PARAM_THREAD_ID) || randomUUID();

      isSearching.current = true;

      actions.setInitialSearch(false);

      updateSearchParams(query, threadId);
      actions.setQuery(query);

      const response = await actions.makeApiCall(query, threadId);

      if (response.aborted) {
        return;
      }
      isSearching.current = false;
    },
    [state.isLoading, updateSearchParams, actions, searchParams],
  );

  const handleSearch = useCallback(
    async (query: string) => {
      await performSearch(query, true);
    },
    [performSearch],
  );

  const handleC1Action = useCallback(
    async (query: string) => {
      await performSearch(query, false);
    },
    [performSearch],
  );

  useEffect(() => {
    if (state.query === currentQuery) {
      return;
    }

    if (state.isLoading && isSearching.current) {
      actions.abortController?.abort();
    }

    performSearch(currentQuery, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuery, performSearch]);

  return { currentQuery, handleSearch, handleC1Action };
};
