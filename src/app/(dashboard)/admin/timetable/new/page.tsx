import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { listTerms } from '@/lib/exams'
import { createTimetableEntry } from '@/lib/timetable/actions'
import { TimetableForm } from '@/components/timetable/timetable-form'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'New Timetable Entry' }

export default async function NewTimetablePage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const [terms, classes, subjects, teachers] = await Promise.all([
    listTerms(),
    prisma.class.findMany({ where: { academicYear: { isActive: true } }, select: { id: true, name: true, section: true, code: true }, orderBy: [{ name: 'asc' }, { section: 'asc' }] }),
    prisma.subject.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } }),
    prisma.teacher.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, employeeId: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="New Timetable Entry"
        subtitle="Add a period to the weekly timetable."
        breadcrumb={
          <Link href="/admin/timetable" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Timetable
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Entry Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <TimetableForm action={createTimetableEntry} submitLabel="Create Entry" classes={classes} subjects={subjects} teachers={teachers} terms={terms} />
        </CardContent>
      </Card>
    </div>
  )
}
