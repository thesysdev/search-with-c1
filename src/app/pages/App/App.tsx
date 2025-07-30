"use client";

import { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "@thesysai/genui-sdk";
import { themePresets } from "@crayonai/react-ui/ThemeProvider";
import { useUIState } from "../../hooks/useUIState";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useSearchHistory } from "../../hooks/useSearchHistory";
import { NavBar } from "../../components/NavBar/NavBar";
import { LandingView } from "../../sections/LandingView";
import { MobileResultsView } from "../../sections/MobileResultsView";
import { DesktopResultsView } from "../../sections/DesktopResultsView";
import "@crayonai/react-ui/styles/index.css";

export const App = () => {
  const isMobile = useIsMobile();
  const { state, actions } = useUIState();
  const { addSearchToHistory, loadQueryFromHistory, currentQuery, updateSearchParams } =
    useSearchHistory(actions);
  const [isClient, setIsClient] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!currentQuery);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (currentQuery) {
      handleSearch(currentQuery);
    }
  }, [currentQuery]);

  const handleSearch = useCallback(async (query: string) => {
    if (query.length > 0 && !state.isLoading) {
      setHasSearched(true);
      const existingSearch = loadQueryFromHistory(query);
      if (existingSearch) return;

      updateSearchParams(query);
      actions.setQuery(query);
      const response = await actions.makeApiCall(query);
      addSearchToHistory(query, {
        c1Response: response.c1Response,
      });
    }
  }, [state.isLoading, loadQueryFromHistory, addSearchToHistory, updateSearchParams, actions]);

  if (!isClient) {
    return null; // or a simple loading state
  }

  return (
    <div
      className="flex flex-col justify-center h-screen w-screen relative"
      key={`home-${hasSearched}`}
    >
      <ThemeProvider mode="light" theme={{ ...themePresets.default.theme }}>
        <NavBar />

        {!hasSearched ? (
          <LandingView
            isMobile={isMobile}
            searchText={state.query}
            handleSearch={handleSearch}
          />
        ) : isMobile ? (
          <MobileResultsView
            handleSearch={handleSearch}
            state={state}
            actions={actions}
          />
        ) : (
          <DesktopResultsView
            handleSearch={handleSearch}
            state={state}
            actions={actions}
          />
        )}
      </ThemeProvider>
    </div>
  );
}; 