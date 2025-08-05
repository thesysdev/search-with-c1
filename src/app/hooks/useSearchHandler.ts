"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import { UIActions, UIState } from "./useUIState";

const QUERY_PARAM_THREAD_ID = "tid";
const QUERY_PARAM_QUERY = "q";

export const useSearchHandler = (
  state: UIState,
  actions: UIActions,
): {
  currentQuery: string;
  handleSearch: (query: string) => Promise<void>;
  handleThreadAction: (query: string) => Promise<void>;
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

  const threadIdParam = useMemo(() => {
    return searchParams.get(QUERY_PARAM_THREAD_ID) || "";
  }, [searchParams]);

  const updateSearchParams = useCallback(
    (query: string, threadId: string) => {
      if (query === currentQuery && threadId === threadIdParam) return;

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

      const threadId = generateThreadId ? uuidv4() : threadIdParam || uuidv4();

      isSearching.current = true;

      actions.setInitialSearch(false);
      actions.setQuery(query);

      updateSearchParams(query, threadId);

      const response = await actions.makeApiCall(query, threadId);

      if (response.aborted) {
        return;
      }
      isSearching.current = false;
    },
    [state.isLoading, updateSearchParams, actions, threadIdParam],
  );

  const handleSearch = useCallback(
    async (query: string) => {
      await performSearch(query, true);
    },
    [performSearch],
  );

  const handleThreadAction = useCallback(
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

    handleThreadAction(currentQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuery, state.isLoading]);

  return { currentQuery, handleSearch, handleThreadAction };
};
