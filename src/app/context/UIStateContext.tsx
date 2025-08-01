"use client";

import { createContext, useContext, ReactNode } from "react";

import { useSearchHandler } from "../hooks/useSearchHandler";
import { useUIState } from "../hooks/useUIState";

interface UIStateContextType
  extends ReturnType<typeof useUIState>,
    ReturnType<typeof useSearchHandler> {}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider = ({ children }: { children: ReactNode }) => {
  const { state, actions } = useUIState();
  const searchHandler = useSearchHandler(state, actions);

  return (
    <UIStateContext.Provider value={{ state, actions, ...searchHandler }}>
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
