import type { Metadata } from 'next'
import { requirePage } from '@/lib/permissions'
import { listAnnouncementsForRole } from '@/lib/announcements'
import { AnnouncementCard } from '@/components/announcements/announcement-card'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { StatCard } from '@/components/stat-card'
import { Bell } from 'lucide-react'

export const metadata: Metadata = { title: 'Announcements' }

export default async function StudentAnnouncementsPage() {
  const user = await requirePage('STUDENT')
  const announcements = await listAnnouncementsForRole('STUDENT', user.id)

  const total = announcements.length

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Announcements" subtitle="Latest school announcements and updates." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Announcements" value={total} icon={Bell} iconColor="bg-blue-500/10" />
      </div>

      {announcements.length === 0 ? (
        <EmptyState icon={Bell} title="No announcements" description="There are no announcements at this time." />
      ) : (
        <div className="space-y-4">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}
    </div>
  )
}
