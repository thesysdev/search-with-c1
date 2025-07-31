"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// const getSystemTheme = (): Theme => {
//   if (typeof window !== 'undefined' && window.matchMedia) {
//     return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
//   }
//   return 'light'
// }

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialTheme = "light",
}) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  const setThemeValue = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeValue,
    }),
    [theme, setThemeValue],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
