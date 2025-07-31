import React from "react";
import { SearchInput } from "../../components/SearchInput";
import { C1Response } from "../../components/C1Response";
import LegacySearch from "../LegacySearch/LegacySearch";
import styles from "./DesktopResultsView.module.scss";
import { useSharedUIState } from "@/app/context/UIStateContext";

export const DesktopResultsView = () => {
  const { state, handleSearch } = useSharedUIState();

  return (
    <div className="flex flex-col fixed top-12 left-0 bottom-0 right-0 bg-container">
      <div className="flex flex-col items-center w-full p-4">
        <SearchInput
          disabled={state.isLoading}
          value={state.query}
          onSearch={handleSearch}
          className={styles.topSearchContainer}
        />
      </div>
      <div className={styles.mainContainer}>
        <div
          className={`${styles.searchResultsContainer} flex flex-col w-[450px] mt-0 mb-4 rounded-3xl shadow-md overflow-hidden`}
        >
          <LegacySearch query={state.query} />
        </div>
        <C1Response />
      </div>
    </div>
  );
};
