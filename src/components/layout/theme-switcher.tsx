'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

const themes = ['light', 'dark', 'system'] as const
type Theme = (typeof themes)[number]

const themeIcons: Record<Theme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const themeLabels: Record<Theme, string> = {
  light: 'Light mode',
  dark: 'Dark mode',
  system: 'System theme',
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), []) // eslint-disable-line react-hooks/set-state-in-effect -- hydration guard

  const current = (theme ?? 'system') as Theme
  const Icon = themeIcons[current]

  const cycle = () => {
    const idx = themes.indexOf(current)
    setTheme(themes[(idx + 1) % themes.length])
  }

  if (!mounted) {
    return (
      <div
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-lg',
          className
        )}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={cycle}
      title={themeLabels[current]}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-lg',
        'glass-input text-muted-foreground',
        'hover:bg-accent/60 hover:text-foreground hover:ring-1 hover:ring-border/50',
        'active:bg-accent/80 transition-all duration-200',
        className
      )}
    >
      <Icon className="size-4 transition-transform duration-300 rotate-0 scale-100" />
    </button>
  )
}
