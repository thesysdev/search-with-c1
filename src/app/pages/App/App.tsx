"use client";

import { themePresets } from "@crayonai/react-ui/ThemeProvider";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { DesktopResultsView } from "@/app/sections/DesktopResultsView";
import { MobileResultsView } from "@/app/sections/MobileResultsView";

import { NavBar } from "../../components/NavBar/NavBar";
import {
  UIStateProvider,
  useSharedUIState,
} from "../../context/UIStateContext";
import { useIsMobile } from "../../hooks/useIsMobile";
import { LandingView } from "../../sections/LandingView";

import "@crayonai/react-ui/styles/index.css";

// Dynamically import ThemeProvider to avoid SSR issues
const ThemeProvider = dynamic(
  () =>
    import("@thesysai/genui-sdk").then((mod) => ({
      default: mod.ThemeProvider,
    })),
  { ssr: false },
);

const AppContent = () => {
  const isMobile = useIsMobile();
  const { state, currentQuery } = useSharedUIState();
  const [mounted, setMounted] = useState(false);
  const hasSearched = !!currentQuery || state.isLoading;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <div className="flex flex-col justify-center h-screen w-screen relative">
        <NavBar />
        <LandingView />
      </div>
    );
  }

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
