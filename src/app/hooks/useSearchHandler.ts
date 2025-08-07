"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  validateAndDecideThread,
  handleInitialThreadValidation,
} from "../utils/threadValidation";

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
  const isSearchAborted = useRef(false);
  const hasValidatedInitialThread = useRef(false);

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
    [pathname, router, currentQuery, threadIdParam],
  );

  const performSearch = useCallback(
    async (query: string, generateThreadId: boolean) => {
      if (query.length === 0 || state.isLoading) {
        return;
      }

      let threadId: string;

      if (generateThreadId) {
        threadId = uuidv4();
        console.log(`Creating new thread: ${threadId}`);
      } else {
        // Use the utility function to validate and decide on thread
        const result = await validateAndDecideThread(threadIdParam);

        if (result.shouldUseExisting) {
          threadId = result.threadId;
          console.log(`Using existing thread: ${threadId}`);
        } else {
          threadId = uuidv4();
          console.log(
            `Thread ${threadIdParam} ${result.reason}, generating new thread: ${threadId}`,
          );
        }
      }

      isSearching.current = true;

      actions.setInitialSearch(false);
      actions.setQuery(query);

      updateSearchParams(query, threadId);

      const response = await actions.makeApiCall(query, threadId);

      if (response.aborted) {
        return;
      }

      // If the backend created a new thread or returned a different threadId,
      // update the URL to reflect the actual thread being used
      if (response.threadId && response.threadId !== threadId) {
        console.log(
          `Backend created new thread: ${response.threadId}, updating URL`,
        );
        updateSearchParams(query, response.threadId);
      } else if (response.threadStatus === "new" && !generateThreadId) {
        // Backend detected expired thread and started fresh, log this for debugging
        console.log(
          `Backend detected expired thread ${threadId}, started fresh`,
        );
      }

      isSearching.current = false;
    },
    [state.isLoading, updateSearchParams, actions, threadIdParam],
  );

  // Validate thread on initial load using utility function
  useEffect(() => {
    handleInitialThreadValidation(
      currentQuery,
      threadIdParam,
      hasValidatedInitialThread,
      state.isLoading,
      performSearch,
    );
  }, [currentQuery, threadIdParam, state.isLoading]);

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
    if (isSearchAborted.current) {
      handleThreadAction(currentQuery);
      isSearchAborted.current = false;
    }
  }, [state.isLoading]);

  useEffect(() => {
    if (state.query === currentQuery) {
      return;
    }

    if (state.isLoading && isSearching.current) {
      actions.abortController?.abort();
      isSearchAborted.current = true;
    } else if (!state.isLoading && !isSearching.current) {
      handleThreadAction(currentQuery);
    }
  }, [currentQuery]);

  return { currentQuery, handleSearch, handleThreadAction };
};
