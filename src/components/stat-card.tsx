import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

type StatCardProps = {
  title: string
  value: string | number
  icon?: LucideIcon
  subtitle?: string
  iconColor?: string
  className?: string
  trend?: { value: number; label?: string }
}

export function StatCard({ title, value, icon: Icon, subtitle, iconColor, className, trend }: StatCardProps) {
  const trendPositive = trend && trend.value >= 0
  const TrendIcon = trendPositive ? TrendingUp : TrendingDown

  return (
    <Card
      className={`transition-all duration-200 hover:shadow-[var(--shadow-raised)] group relative overflow-hidden animate-fade-in ${className ?? ''}`}
    >
      <CardContent className="p-5 relative space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {Icon && (
            <div className={`rounded-xl ${iconColor ?? 'bg-primary/10'} p-2.5`}>
              <Icon className="size-5 text-primary" />
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-muted-foreground">{subtitle}</div>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <TrendIcon className={`size-3.5 ${trendPositive ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className={`text-xs font-medium ${trendPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {trendPositive ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
