"use client";

import "@crayonai/react-ui/styles/index.css";
import { ThemeProvider, C1Component } from "@thesysai/genui-sdk";
import { useUIState } from "./uiState";
import Image from "next/image";
import { useState, useEffect } from "react";
import styles from "./HomePage.module.scss";
import { TextLoader } from "./Loader";
import { themePresets } from "@crayonai/react-ui/ThemeProvider";
import LegacySearch from "./LegacySearch/LegacySearch";
import { NavBar } from "./NavBar";

export const HomePage = () => {
  const { state, actions } = useUIState();

  const [searchText, setSearchText] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isClient, setIsClient] = useState(false);

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

  if (!isClient) {
    return null; // or a simple loading state
  }

  return (
    <div
      className="flex flex-col justify-center h-screen w-screen relative"
      key={`home-${hasSearched}`}
    >
      <ThemeProvider mode="light" theme={{ ...themePresets.jade.theme }}>
        <NavBar />
        {!hasSearched && (
          <div className="fixed inset-0 w-full h-full z-0 overflow-hidden">
            <Image
              src="/background.svg"
              alt="background"
              fill
              priority
              className="object-cover"
            />
          </div>
        )}

        {!hasSearched ? (
          <div className="flex flex-col items-center justify-center -mt-[60px] relative z-10">
            <div className="flex mb-xl">
              <Image
                src="/page-title.svg"
                alt="Thesys Logo"
                width={300}
                height={100}
                priority
              />
            </div>
            <div className={styles.centeredSearchContainer}>
              <input
                value={searchText}
                placeholder="Search..."
                onChange={({ target: { value } }) => setSearchText(value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </div>
            <p className={styles.poweredByContainer}>
              <Image
                src="/page-subtitle.svg"
                alt="Thesys Logo"
                width={300}
                height={23}
                priority
              />
            </p>
          </div>
        ) : (
          <div className="flex flex-col fixed top-12 left-0 bottom-0 right-0 bg-container">
            <div className="flex flex-col items-center w-full p-4">
              <div className={styles.topSearchContainer}>
                <input
                  value={searchText}
                  placeholder="Search..."
                  onChange={({ target: { value } }) => setSearchText(value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>
            </div>
            <div className={styles.mainContainer}>
              <div
                className={`${styles.searchResultsContainer} flex flex-col w-[450px] mt-0 mb-4 rounded-lg shadow-md overflow-hidden`}
              >
                <LegacySearch query={state.query} />
              </div>
              {state.isLoading && state.c1Response.length === 0 ? (
                <div
                  className={`${styles.c1Container} mb-4 mt-0 rounded-3xl border border-default p-2`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <TextLoader
                      className={"crayon-shell-thread-message-loading"}
                      show={true}
                      text={`Composing response...`}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={`${styles.c1Container} mb-4 mt-0`}
                >
                  <C1Component
                    key={state.query}
                    c1Response={state.c1Response}
                    isStreaming={state.isLoading}
                    updateMessage={(message) => actions.setC1Response(message)}
                    onAction={({ llmFriendlyMessage }) => {
                      if (!state.isLoading) {
                        actions.makeApiCall(
                          llmFriendlyMessage,
                          state.c1Response
                        );
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </ThemeProvider>
    </div>
  );
};
