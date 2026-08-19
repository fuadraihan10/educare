import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function DashboardNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 animate-fade-in">
      <div className="rounded-2xl bg-muted p-5">
        <FileQuestion className="size-8 text-muted-foreground" />
      </div>
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Page not found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-subtle)] hover:shadow-[var(--shadow-raised)] active:shadow-[var(--shadow-pressed)] transition-all duration-200"
      >
        Back to dashboard
      </Link>
    </div>
  )
}
