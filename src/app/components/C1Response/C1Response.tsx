"use client";

import React from "react";
import { C1Component } from "@thesysai/genui-sdk";
import styles from "./C1Response.module.scss";
import { searchImage } from "@/app/api/image_search/searchImage";
import { useSharedUIState } from "@/app/context/UIStateContext";

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
        onAction={handleC1Action}
        // @ts-ignore
        searchImage={async (query) => {
          return await searchImage(query);
        }}
      />
    </div>
  );
};
