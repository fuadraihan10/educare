import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listSubjects } from '@/lib/subjects'
import { listAcademicYears } from '@/lib/classes'
import { prisma } from '@/lib/db'
import { createAssignment } from '@/lib/subjects/actions'
import { AssignmentForm } from '@/components/subjects/assignment-form'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'New Assignment' }

export default async function NewAssignmentPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const [subjects, years, classes, teachers] = await Promise.all([
    listSubjects({ pageSize: 100 }).then((r) => r.subjects),
    listAcademicYears(),
    prisma.class.findMany({ where: { academicYear: { isActive: true } }, select: { id: true, name: true, section: true, code: true }, orderBy: [{ name: 'asc' }, { section: 'asc' }] }),
    prisma.teacher.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true, employeeId: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Add Teaching Assignment"
        subtitle="Assign a teacher to teach a subject for a class in a given year."
        breadcrumb={
          <Link href="/admin/subjects/assignments" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Assignments
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Assignment Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AssignmentForm action={createAssignment} submitLabel="Create Assignment" classes={classes} subjects={subjects} teachers={teachers} years={years} />
        </CardContent>
      </Card>
    </div>
  )
}
