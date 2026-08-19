import { Skeleton } from '@/components/ui/skeleton'
import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 animate-fade-in">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-xs font-medium">Loading…</span>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 animate-shimmer" />
        <Skeleton className="h-4 w-48 animate-shimmer" style={{ animationDelay: '0.1s' }} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl animate-shimmer" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <Skeleton className="h-72 rounded-2xl animate-shimmer" style={{ animationDelay: '0.4s' }} />
    </div>
  )
}
