import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { listTerms } from '@/lib/exams'
import { createAssessment } from '@/lib/exams/actions'
import { AssessmentForm } from '@/components/exams/assessment-form'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'New Assessment' }

export default async function TeacherNewAssessmentPage() {
  const user = await requirePage('TEACHER')
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } })

  const assignments = teacher
    ? await prisma.teacherAssignment.findMany({
        where: { teacherId: teacher.id, academicYear: { isActive: true } },
        select: { classId: true, subjectId: true },
      })
    : []

  const classIds = [...new Set(assignments.map((a) => a.classId))]
  const subjectIds = [...new Set(assignments.map((a) => a.subjectId))]

  const [terms, classes, subjects] = await Promise.all([
    listTerms(),
    classIds.length > 0
      ? prisma.class.findMany({ where: { id: { in: classIds } }, select: { id: true, name: true, section: true, code: true }, orderBy: [{ name: 'asc' }, { section: 'asc' }] })
      : [],
    subjectIds.length > 0
      ? prisma.subject.findMany({ where: { id: { in: subjectIds } }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } })
      : [],
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="New Assessment"
        subtitle="Create a new assessment for your class."
        breadcrumb={
          <Link href="/teacher/exams" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Exams
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Assessment Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <AssessmentForm action={createAssessment} submitLabel="Create Assessment" classes={classes} subjects={subjects} terms={terms} />
        </CardContent>
      </Card>
    </div>
  )
}
