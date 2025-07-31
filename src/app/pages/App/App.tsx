"use client";

import { useEffect } from "react";
import { ThemeProvider } from "@thesysai/genui-sdk";
import { themePresets } from "@crayonai/react-ui/ThemeProvider";
import { useIsMobile } from "../../hooks/useIsMobile";
import { useSearchHistory } from "../../hooks/useSearchHistory";
import { NavBar } from "../../components/NavBar/NavBar";
import { LandingView } from "../../sections/LandingView";
import {
  UIStateProvider,
  useSharedUIState,
} from "../../context/UIStateContext";
import "@crayonai/react-ui/styles/index.css";
import { DesktopResultsView } from "@/app/sections/DesktopResultsView";
import { MobileResultsView } from "@/app/sections/MobileResultsView";

const AppContent = () => {
  const isMobile = useIsMobile();
  const { state, currentQuery } = useSharedUIState();
  const hasSearched = !!currentQuery || state.isLoading;

  return (
    <div
      className="flex flex-col justify-center h-screen w-screen relative"
      key={`home-${hasSearched}`}
    >
      <ThemeProvider mode="light" theme={{ ...themePresets.default.theme }}>
        <NavBar />

        {!hasSearched ? (
          <LandingView />
        ) : isMobile ? (
          <MobileResultsView />
        ) : (
          <DesktopResultsView />
        )}
      </ThemeProvider>
    </div>
  );
};

export const App = () => (
  <UIStateProvider>
    <AppContent />
  </UIStateProvider>
);
