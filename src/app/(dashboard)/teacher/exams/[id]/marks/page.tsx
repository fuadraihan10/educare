import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getAssessment, getGradeScale } from '@/lib/exams'
import { enterMarks } from '@/lib/exams/actions'
import { MarksEntryForm } from '@/components/exams/marks-entry-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { prisma } from '@/lib/db'

export const metadata: Metadata = { title: 'Marks Entry' }

export default async function TeacherMarksEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage('TEACHER')
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } })
  if (!teacher) notFound()

  const { id } = await params
  const assessment = await getAssessment(id)
  if (!assessment || assessment.teacherId !== teacher.id) notFound()

  const students = await prisma.student.findMany({
    where: { classId: assessment.classId, status: 'ACTIVE' },
    select: { id: true, firstName: true, lastName: true, admissionNo: true, rollNo: true },
    orderBy: { rollNo: 'asc' },
  })

  const existingMarks = assessment.marks.map((m) => ({ studentId: m.studentId, marksObtained: m.marksObtained, grade: m.grade, gradePoint: m.gradePoint }))
  const gradeScale = await getGradeScale()

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Enter Marks — ${assessment.name}`}
        subtitle={<span className="text-xs">{assessment.class.name} · Section {assessment.class.section} — {assessment.subject.name} (Max: {String(assessment.maxMarks)})</span>}
        breadcrumb={
          <Link href="/teacher/exams" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Exams
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Marks Entry</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <MarksEntryForm
            action={enterMarks}
            assessmentId={id}
            students={students}
            existingMarks={existingMarks}
            maxMarks={Number(assessment.maxMarks)}
            gradeScale={gradeScale.map((g) => ({ label: g.label, minPercent: Number(g.minPercent), maxPercent: Number(g.maxPercent), points: Number(g.points), order: g.order }))}
          />
        </CardContent>
      </Card>
    </div>
  )
}
