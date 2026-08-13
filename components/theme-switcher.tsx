"use client";

import { useTheme } from "@/lib/theme-provider";
import { Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      aria-label={theme === "dark" ? "Light mode" : "Dark mode"}
      onClick={() => toggleTheme()}
      className="inline-flex items-center justify-center rounded-md p-2 border border-border bg-card mr-2 focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
