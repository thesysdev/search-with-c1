"use client";

import "@crayonai/react-ui/styles/index.css";
import { ThemeProvider, C1Component } from "@thesysai/genui-sdk";
import { useUIState } from "./uiState";
import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "./HomePage.module.scss";
import { TextLoader } from "./Loader";
import { themePresets } from "@crayonai/react-ui/ThemeProvider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@crayonai/react-ui";
import LegacySearch from "./LegacySearch/LegacySearch";
import { NavBar } from "./NavBar";
import { useIsMobile } from "./hooks/useIsMobile";
import clsx from "clsx";

// Define proper types for state and actions
interface UIState {
  isLoading: boolean;
  query: string;
  c1Response: string;
  progressUpdates: string[];
}

interface UIActions {
  setQuery: (query: string) => void;
  setC1Response: (message: string) => void;
  setProgressUpdates: (updates: string[]) => void;
  makeApiCall: (message: string, currentResponse?: string) => Promise<void>;
}

const ProgressSteps = ({ progressUpdates }: { progressUpdates: string[] }) => {
  const isMobile = useIsMobile();

  const parsedUpdates = progressUpdates.map((update) => {
    try {
      const jsonContent = update.replace(
        /<progress>([\s\S]*?)<\/progress>/,
        "$1"
      );
      const data = JSON.parse(jsonContent);
      return {
        title: data.title || "Processing",
        content: data.content || "",
      };
    } catch (e) {
      return { title: "Processing", content: "" };
    }
  });

  const uniqueSteps = parsedUpdates.reduce((acc, curr) => {
    if (!acc.some((item) => item.title === curr.title)) {
      acc.push(curr);
    }
    return acc;
  }, [] as { title: string; content: string }[]);

  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center h-full w-full"
      )}
    >
      {uniqueSteps.length === 0 && (
        <TextLoader
          className="crayon-shell-thread-message-loading mb-4"
          show={true}
          text="Composing response..."
        />
      )}
      <div className="flex flex-col gap-2 w-full max-w-md">
        {uniqueSteps.map((step, index) => (
          <div
            key={index}
            className="flex items-center rounded-md p-1 animate-pulse"
          >
            <div className="w-full">
              <h4 className="text-sm line-clamp-2">{step.title}</h4>
              {step.content && (
                <p className="text-xs text-secondary line-clamp-2">
                  {step.content}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Common SearchInput component to avoid duplication
const SearchInput = ({
  value,
  onChange,
  onKeyDown,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  className?: string;
}) => (
  <div className={className}>
    <input
      value={value}
      placeholder="Search..."
      onChange={({ target: { value } }) => onChange(value)}
      onKeyDown={onKeyDown}
      autoFocus
    />
  </div>
);

// C1Response component for showing AI responses
const C1Response = ({
  isLoading,
  c1Response,
  query,
  progressUpdates,
  setC1Response,
  makeApiCall,
  className,
}: {
  isLoading: boolean;
  c1Response: string;
  query: string;
  progressUpdates: string[];
  setC1Response: (message: string) => void;
  makeApiCall: (message: string, currentResponse?: string) => void;
  className?: string;
}) => {
  if (isLoading && c1Response.length === 0) {
    return (
      <div
        className={`${
          styles.c1Container
        } mb-4 mt-0 rounded-3xl border border-default p-2 ${className || ""}`}
      >
        <ProgressSteps progressUpdates={progressUpdates} />
      </div>
    );
  }

  return (
    <div className={`${styles.c1Container} mb-4 mt-0 ${className || ""}`}>
      <C1Component
        key={query}
        c1Response={c1Response}
        isStreaming={isLoading}
        updateMessage={setC1Response}
        onAction={({ llmFriendlyMessage }) => {
          if (!isLoading) {
            makeApiCall(llmFriendlyMessage, c1Response);
          }
        }}
      />
    </div>
  );
};

// Landing view when user hasn't searched yet
const LandingView = ({
  isMobile,
  searchText,
  setSearchText,
  handleKeyDown,
}: {
  isMobile: boolean;
  searchText: string;
  setSearchText: (text: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}) => (
  <>
    <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
      <Image
        src="/background.svg"
        alt="background"
        fill
        priority
        className="object-cover"
      />
    </div>
    <div
      className={clsx(
        "flex flex-col items-center justify-center -mt-[60px] relative z-10",
        isMobile && "mx-5"
      )}
    >
      <div className="flex mb-xl">
        <Image
          src="/page-title.svg"
          alt="Thesys Logo"
          width={isMobile ? 200 : 300}
          height={isMobile ? 100 : 100}
          priority
        />
      </div>
      <SearchInput
        value={searchText}
        onChange={setSearchText}
        onKeyDown={handleKeyDown}
        className={styles.centeredSearchContainer}
      />
      <p className={styles.poweredByContainer}>
        <Image
          src="/page-subtitle.svg"
          alt="Thesys Logo"
          width={isMobile ? 250 : 300}
          height={23}
          priority
        />
      </p>
    </div>
  </>
);

// Results view for mobile devices
const MobileResultsView = ({
  activeTab,
  handleTabChange,
  searchText,
  setSearchText,
  handleKeyDown,
  state,
  actions,
}: {
  activeTab: string;
  handleTabChange: (value: string) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  state: UIState;
  actions: UIActions;
}) => (
  <div className="flex flex-col fixed top-12 left-0 bottom-0 right-0 bg-container">
    <div className="flex flex-col items-center w-full p-4">
      <SearchInput
        value={searchText}
        onChange={setSearchText}
        onKeyDown={handleKeyDown}
        className={styles.topSearchContainer}
      />
    </div>
    <div className={styles.mainContainer}>
      <div className="flex flex-col w-full h-full px-4">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="mb-4 h-full"
        >
          <TabsList>
            <TabsTrigger value="ai" text="AI Mode" />
            <TabsTrigger value="search" text="Search" />
          </TabsList>
          <TabsContent value="search" className="w-full h-full relative">
            <div
              className={`${styles.searchResultsContainer} flex flex-col w-full mt-0 mb-4 rounded-lg shadow-md overflow-hidden absolute inset-0 w-full h-full`}
            >
              <LegacySearch query={state.query} />
            </div>
          </TabsContent>
          <TabsContent value="ai" className="w-full h-full relative">
            <div className="absolute inset-0 w-full h-full">
              <C1Response
                isLoading={state.isLoading}
                c1Response={state.c1Response}
                query={state.query}
                progressUpdates={state.progressUpdates}
                setC1Response={actions.setC1Response}
                makeApiCall={actions.makeApiCall}
                className="w-full"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
);

// Results view for desktop devices
const DesktopResultsView = ({
  searchText,
  setSearchText,
  handleKeyDown,
  state,
  actions,
}: {
  searchText: string;
  setSearchText: (text: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  state: UIState;
  actions: UIActions;
}) => (
  <div className="flex flex-col fixed top-12 left-0 bottom-0 right-0 bg-container">
    <div className="flex flex-col items-center w-full p-4">
      <SearchInput
        value={searchText}
        onChange={setSearchText}
        onKeyDown={handleKeyDown}
        className={styles.topSearchContainer}
      />
    </div>
    <div className={styles.mainContainer}>
      <div
        className={`${styles.searchResultsContainer} flex flex-col w-[450px] mt-0 mb-4 rounded-3xl shadow-md overflow-hidden`}
      >
        <LegacySearch query={state.query} />
      </div>
      <C1Response
        isLoading={state.isLoading}
        c1Response={state.c1Response}
        query={state.query}
        progressUpdates={state.progressUpdates}
        setC1Response={actions.setC1Response}
        makeApiCall={actions.makeApiCall}
      />
    </div>
  </div>
);

export const HomePage = () => {
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

  const handleSearch = async () => {
    if (searchText.length > 0 && !state.isLoading) {
      actions.setQuery(searchText);
      setHasSearched(true);
      await actions.makeApiCall(searchText);
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
            setSearchText={setSearchText}
            handleKeyDown={handleKeyDown}
            state={state}
            actions={actions}
          />
        ) : (
          <DesktopResultsView
            searchText={searchText}
            setSearchText={setSearchText}
            handleKeyDown={handleKeyDown}
            state={state}
            actions={actions}
          />
        )}
      </ThemeProvider>
    </div>
  );
};
