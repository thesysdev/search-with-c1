"use client";

import { useState, useEffect } from "react";
import { ThemeProvider } from "@thesysai/genui-sdk";
import { themePresets } from "@crayonai/react-ui/ThemeProvider";
import { useUIState } from "../../hooks/useUIState";
import { useIsMobile } from "../../hooks/useIsMobile";
import { NavBar } from "../../components/NavBar/NavBar";
import { LandingView } from "../../sections/LandingView";
import { MobileResultsView } from "../../sections/MobileResultsView";
import { DesktopResultsView } from "../../sections/DesktopResultsView";
import "@crayonai/react-ui/styles/index.css";

export const App = () => {
  const isMobile = useIsMobile();
  const { state, actions } = useUIState();

  const [searchText, setSearchText] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");

  // This ensures we only run animations on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSearch = async (query?: string) => {
    const newQuery = query || searchText;
    if (newQuery.length > 0 && !state.isLoading) {
      setSearchText(newQuery);
      actions.setQuery(newQuery);
      setHasSearched(true);
      await actions.makeApiCall(newQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !state.isLoading && searchText.length > 0) {
      handleSearch();
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

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
            searchText={searchText}
            setSearchText={setSearchText}
            handleKeyDown={handleKeyDown}
          />
        ) : isMobile ? (
          <MobileResultsView
            activeTab={activeTab}
            handleTabChange={handleTabChange}
            searchText={searchText}
            setSearchText={(text) => {
              setSearchText(text);
              handleSearch(text);
            }}
            handleKeyDown={handleKeyDown}
            state={state}
            actions={actions}
          />
        ) : (
          <DesktopResultsView
            searchText={searchText}
            setSearchText={(text) => {
              setSearchText(text);
              handleSearch(text);
            }}
            handleKeyDown={handleKeyDown}
            state={state}
            actions={actions}
          />
        )}
      </ThemeProvider>
    </div>
  );
}; 