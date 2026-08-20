"use client"

import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AnimatedContainer } from "@/components/ui/animated-container"
import { cn } from "@/lib/utils"

interface ChartCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

function ChartCard({
  title,
  subtitle,
  action,
  className,
  children,
}: ChartCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && (
              <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <AnimatedContainer>{children}</AnimatedContainer>
      </CardContent>
    </Card>
  )
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function ChartTooltipContent({
  active,
  payload,
  label,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="glass-card rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
      {label && (
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          {label}
        </p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ChartLegendProps {
  payload?: Array<{ value: string; color: string }>
}

function ChartLegend({ payload }: ChartLegendProps) {
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5 text-sm">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export { ChartCard, ChartTooltipContent, ChartLegend }
