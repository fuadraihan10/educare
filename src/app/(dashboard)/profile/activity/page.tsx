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
  const activities = await prisma.userActivityLog.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 100 })

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Activity Log" subtitle="Your recent account activity">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </PageHeader>

      <ActivityFilter activities={activities.map((a) => ({ ...a, createdAt: a.createdAt.toISOString(), details: a.details as Record<string, unknown> | null }))} />
    </div>
  )
}
