import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 animate-fade-in">
      <div className="rounded-2xl bg-muted p-5">
        <GraduationCap className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-2 text-center">
        <h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">Page not found</p>
      </div>
      <Link
        href="/login"
        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-raised)] active:shadow-[var(--shadow-pressed)] transition-all duration-200"
      >
        Go to login
      </Link>
    </div>
  )
}
