"use client";

import { createContext, useContext, ReactNode } from "react";
import { useUIState } from "../hooks/useUIState";
import { useSearchHandler } from "../hooks/useSearchHandler";

interface UIStateContextType
  extends ReturnType<typeof useUIState>,
    ReturnType<typeof useSearchHandler> {}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider = ({ children }: { children: ReactNode }) => {
  const { state, actions } = useUIState();
  const { handleSearch, handleC1Action, currentQuery } = useSearchHandler(
    state,
    actions,
  );

  return (
    <UIStateContext.Provider
      value={{ state, actions, handleSearch, handleC1Action, currentQuery }}
    >
      {children}
    </UIStateContext.Provider>
  );
};

export const useSharedUIState = () => {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error("useSharedUIState must be used within a UIStateProvider");
  }
  return context;
};
