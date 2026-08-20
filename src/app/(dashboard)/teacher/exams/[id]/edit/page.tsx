import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { getAssessment, listTerms } from '@/lib/exams'
import { updateAssessment } from '@/lib/exams/actions'
import { AssessmentForm } from '@/components/exams/assessment-form'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Edit Assessment' }

export default async function TeacherEditAssessmentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage('TEACHER')
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } })
  if (!teacher) notFound()

  const { id } = await params
  const assessment = await getAssessment(id)
  if (!assessment || assessment.teacherId !== teacher.id) notFound()

  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId: teacher.id, academicYear: { isActive: true } },
    select: { classId: true, subjectId: true },
  })

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

  const defaultValues = {
    name: assessment.name,
    type: assessment.type,
    classId: assessment.classId,
    subjectId: assessment.subjectId,
    termId: assessment.termId,
    maxMarks: Number(assessment.maxMarks),
    weight: Number(assessment.weight),
    date: assessment.date ? new Date(assessment.date).toISOString().split('T')[0] : '',
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Edit Assessment"
        subtitle={`Editing ${assessment.name}`}
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
          <AssessmentForm
            action={updateAssessment.bind(null, id)}
            submitLabel="Save Changes"
            classes={classes}
            subjects={subjects}
            terms={terms}
            defaultValues={defaultValues}
          />
        </CardContent>
      </Card>
    </div>
  )
}
