import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  subtitle?: ReactNode
  action?: ReactNode
  children?: ReactNode
  breadcrumb?: ReactNode
}

export function PageHeader({ title, subtitle, action, children, breadcrumb }: PageHeaderProps) {
  return (
    <div className="animate-fade-in space-y-4">
      {breadcrumb && <div className="text-sm text-muted-foreground">{breadcrumb}</div>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          )}
        </div>

        {(action || children) && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {action}
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
