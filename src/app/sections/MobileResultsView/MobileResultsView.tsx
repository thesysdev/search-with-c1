import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@crayonai/react-ui";
import { SearchInput } from "../../components/SearchInput";
import { C1Response } from "../../components/C1Response";
import LegacySearch from "../LegacySearch/LegacySearch";
import styles from "./MobileResultsView.module.scss";
import { useSharedUIState } from "@/app/context/UIStateContext";
import { useSearchHandler } from "@/app/hooks/useSearchHandler";

export const MobileResultsView = () => {
  const { state, actions } = useSharedUIState();
  const [activeTab, setActiveTab] = useState("ai");
  const { handleSearch } = useSearchHandler();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="flex flex-col fixed top-12 left-0 bottom-0 right-0 bg-container">
      <div className="flex flex-col items-center w-full p-4">
        <SearchInput
          value={state.query}
          disabled={state.isLoading}
          onSearch={handleSearch}
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
                <C1Response className="w-full" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
