"use client";

import React from "react";
import { C1Component } from "@thesysai/genui-sdk";
import styles from "./C1Response.module.scss";
import { makeC1Response } from "@thesysai/genui-sdk/server";

interface C1ResponseProps {
  isLoading: boolean;
  c1Response: string;
  query: string;
  setC1Response: (message: string) => void;
  makeApiCall: (message: string, currentResponse?: string) => void;
  className?: string;
}

export const C1Response = ({
  isLoading,
  c1Response,
  query,
  setC1Response,
  makeApiCall,
  className,
}: C1ResponseProps) => {
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