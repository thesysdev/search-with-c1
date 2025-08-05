"use client";

import { C1Component } from "@thesysai/genui-sdk";
import React from "react";

import { searchImage } from "@/app/api/services/googleImageSearch";
import { useSharedUIState } from "@/app/context/UIStateContext";

import styles from "./C1Response.module.scss";

interface C1ResponseProps {
  className?: string;
}

export const C1Response = ({ className }: C1ResponseProps) => {
  const { state, actions, handleC1Action } = useSharedUIState();

  return (
    <div className={`${styles.c1Container} mb-4 mt-0 ${className || ""}`}>
      <C1Component
        key={state.query}
        c1Response={state.c1Response}
        isStreaming={state.isLoading}
        updateMessage={(message: string) => actions.setC1Response(message)}
        onAction={(action) => handleC1Action(action.humanFriendlyMessage)}
        // @ts-expect-error - searchImage is not typed
        searchImage={async (query) => {
          return await searchImage(query);
        }}
      />
    </div>
  );
};
