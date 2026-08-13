'use client'

import { useTheme } from '@/lib/theme-provider'
import { Moon, Sun } from 'lucide-react'

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme()

    return (
      <button
        title="Toggle theme"
        aria-label="Toggle theme"
        onClick={() => toggleTheme()}
        className="inline-flex items-center justify-center rounded-full border border-border bg-card p-2 text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>
    )
}
