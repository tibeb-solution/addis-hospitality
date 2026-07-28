"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Get theme from localStorage or system preference
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    let initialTheme: Theme = "light";
    if (storedTheme) {
      initialTheme = storedTheme;
    } else if (prefersDark) {
      initialTheme = "dark";
    }

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    html.classList.remove("light", "dark");
    if (newTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.add("light");
    }
  };

  // Always render the provider so client components using `useTheme`
  // can access the context during hydration. `mounted` is only used
  // to control DOM side-effects (applying the theme class).
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback for safety during unexpected hydration orders.
    return {
      theme: "light" as Theme,
      toggleTheme: () => {},
    };
  }

  return context;
}
