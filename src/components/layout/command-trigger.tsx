'use client'

import { Search } from 'lucide-react'

export function CommandTrigger() {
  return (
    <button
      type="button"
      className="flex h-9 items-center gap-2 rounded-lg border border-border/50 bg-card px-2.5 text-muted-foreground shadow-[var(--shadow-subtle)] hover:bg-muted hover:text-foreground hover:shadow-[var(--shadow-raised)] active:shadow-[var(--shadow-pressed)] transition-all duration-150"
      aria-label="Search"
      onClick={() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
      }}
    >
      <Search className="size-3.5" />
      <span className="text-xs hidden md:inline">Search</span>
      <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-border/50 bg-muted/50 px-1 py-0.5 text-[10px] font-mono text-muted-foreground/70">
        <span className="text-[9px]">&#8984;</span>K
      </kbd>
    </button>
  )
}
