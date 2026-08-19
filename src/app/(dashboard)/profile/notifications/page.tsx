import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/page-header'
import { NotificationsForm } from './notifications-form'

export const metadata: Metadata = { title: 'Notification Preferences' }

export default async function NotificationsPage() {
  const user = await requirePage('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  const preferences = await prisma.userPreference.findUnique({ where: { userId: user.id } })

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Notifications" subtitle="Configure how and when you receive notifications">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </PageHeader>
      <NotificationsForm preferences={preferences} />
    </div>
  )
}
