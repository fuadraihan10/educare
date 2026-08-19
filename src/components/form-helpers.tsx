'use client'

import { useId, type ReactNode } from 'react'

type FieldProps = {
  error?: string
  children: ReactNode
}

export function Field({ error, children }: FieldProps) {
  const errorId = useId()
  return (
    <div className="space-y-1.5">
      {children}
      {error && <p id={errorId} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export const selectClass =
  'h-9 rounded-lg border border-input bg-background dark:bg-input/30 px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted/50'
