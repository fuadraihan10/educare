import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-card rounded-2xl p-8 animate-fade-in">
      <div className="flex flex-col items-center justify-center text-center">
        {Icon && (
          <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50 shadow-[var(--shadow-pressed)] mb-4">
            <Icon className="size-7 text-muted-foreground/60" />
          </div>
        )}

        <h3 className="text-lg font-semibold text-foreground">{title}</h3>

        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm">{description}</p>
        )}

        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  )
}
