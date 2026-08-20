import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/page-header'
import { ActivityFilter } from './activity-filter'

export const metadata: Metadata = { title: 'Activity Log' }

export default async function ActivityPage() {
  const user = await requirePage('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')

  const [activities, counts] = await Promise.all([
    prisma.userActivityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 500,
    }),
    prisma.userActivityLog.groupBy({
      by: ['category', 'result'],
      where: { userId: user.id },
      _count: true,
    }),
  ])

  const categoryCounts: Record<string, number> = {}
  let totalSuccess = 0
  let totalFailure = 0
  for (const row of counts) {
    categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + row._count
    if (row.result === 'failure') totalFailure += row._count
    else totalSuccess += row._count
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Activity Log" subtitle={`${activities.length} recorded events`}>
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </PageHeader>

      <ActivityFilter
        activities={activities.map((a) => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
          details: a.details as Record<string, unknown> | null,
        }))}
        categoryCounts={categoryCounts}
        totalSuccess={totalSuccess}
        totalFailure={totalFailure}
      />
    </div>
  )
}
