'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground active:bg-accent/80 transition-all duration-200"
      aria-label="Toggle theme"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="size-4 hidden dark:block" />
    </button>
  )
}
