'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function AuthError({
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
    <div className="flex min-h-screen items-center justify-center p-8 animate-fade-in">
      <div className="glass-card rounded-2xl p-8 max-w-sm w-full space-y-6 text-center">
        <div className="mx-auto rounded-2xl bg-destructive/10 p-5 w-fit">
          <AlertTriangle className="size-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Please try again.
          </p>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-raised)] active:shadow-[var(--shadow-pressed)] transition-all duration-200"
          >
            Try again
          </button>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  )
}
