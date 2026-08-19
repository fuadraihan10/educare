import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { createAnnouncement } from '@/lib/announcements/actions'
import { AnnouncementForm } from '@/components/announcements/announcement-form'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'New Announcement' }

export default async function NewAnnouncementPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN', 'TEACHER')
  const classes = await prisma.class.findMany({
    where: { academicYear: { isActive: true } },
    select: { id: true, name: true, section: true, code: true },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="New Announcement"
        subtitle="Create a school-wide or targeted announcement."
        breadcrumb={
          <Link href="/admin/announcements" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Announcements
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Announcement Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AnnouncementForm action={createAnnouncement} submitLabel="Publish Announcement" classes={classes} />
        </CardContent>
      </Card>
    </div>
  )
}
