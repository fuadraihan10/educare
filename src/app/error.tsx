'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center animate-fade-in">
      <div className="rounded-2xl bg-destructive/10 p-5">
        <AlertTriangle className="size-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md">
          An unexpected error occurred while loading this page. Please try again.
        </p>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-raised)] active:shadow-[var(--shadow-pressed)] transition-all duration-200"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-border px-6 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
