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

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme");
    const initialTheme: Theme =
      storedTheme === "dark" || storedTheme === "light" ? storedTheme : "light";

    setTheme(initialTheme);
    applyTheme(initialTheme);
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
