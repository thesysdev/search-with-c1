"use client";

import { createContext, useContext, ReactNode } from "react";
import { useUIState, UIState, UIActions } from "../hooks/useUIState";

interface UIStateContextType {
  state: UIState;
  actions: UIActions;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const UIStateProvider = ({ children }: { children: ReactNode }) => {
  const { state, actions } = useUIState();

  return (
    <UIStateContext.Provider value={{ state, actions }}>
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
