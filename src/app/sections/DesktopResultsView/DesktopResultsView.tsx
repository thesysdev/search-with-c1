import React from "react";
import { SearchInput } from "../../components/SearchInput";
import { C1Response } from "../../components/C1Response";
import LegacySearch from "../LegacySearch/LegacySearch";
import styles from "./DesktopResultsView.module.scss";

interface UIState {
  isLoading: boolean;
  query: string;
  c1Response: string;
}

interface UIActions {
  setQuery: (query: string) => void;
  setC1Response: (message: string) => void;
  makeApiCall: (message: string, currentResponse?: string) => Promise<void>;
}

interface DesktopResultsViewProps {
  searchText: string;
  setSearchText: (text: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  state: UIState;
  actions: UIActions;
}

export const DesktopResultsView = ({
  searchText,
  setSearchText,
  handleKeyDown,
  state,
  actions,
}: DesktopResultsViewProps) => (
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
        setC1Response={actions.setC1Response}
        makeApiCall={actions.makeApiCall}
        setSearchText={setSearchText}
      />
    </div>
  </div>
); 