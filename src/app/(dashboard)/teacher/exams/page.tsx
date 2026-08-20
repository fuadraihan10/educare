import Link from 'next/link'
import type { Metadata } from 'next'
import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { StatCard } from '@/components/stat-card'
import { Plus, ClipboardList, AlertCircle, BookOpen, CheckCircle, FileEdit, PenLine, SquarePen } from 'lucide-react'
import { TeacherAssessmentActions } from './teacher-assessment-actions'

export const metadata: Metadata = { title: 'Exams & Grades' }

export default async function TeacherExamsPage() {
  const user = await requirePage('TEACHER')
  const teacher = await prisma.teacher.findUnique({ where: { userId: user.id }, select: { id: true } })
  if (!teacher) return <EmptyState icon={AlertCircle} title="Teacher profile not found" description="Your teacher profile could not be loaded." />

  const assessments = await prisma.assessment.findMany({
    where: { teacherId: teacher.id },
    include: {
      class: { select: { name: true, section: true, code: true } },
      subject: { select: { name: true } },
      term: { select: { name: true } },
      _count: { select: { marks: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const published = assessments.filter((a) => a.isPublished).length
  const drafts = assessments.length - published
  const totalMarks = assessments.reduce((s, a) => s + a._count.marks, 0)

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="Exams & Grades"
        subtitle={`${assessments.length} assessment(s)`}
        action={
          <Button render={<Link href="/teacher/exams/new" />}>
            <Plus /> New Assessment
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Assessments" value={assessments.length} icon={ClipboardList} iconColor="bg-blue-500/10" />
        <StatCard title="Published" value={published} icon={CheckCircle} iconColor="bg-emerald-500/10" subtitle="Visible to students" />
        <StatCard title="Drafts" value={drafts} icon={FileEdit} iconColor="bg-amber-500/10" subtitle="Not yet published" />
        <StatCard title="Total Marks" value={totalMarks} icon={BookOpen} iconColor="bg-violet-500/10" subtitle="Entries recorded" />
      </div>

      {assessments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assessments yet" description="Create your first assessment to start entering marks." action={<Button render={<Link href="/teacher/exams/new" />}><Plus /> Create Assessment</Button>} />
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4">
            <h2 className="text-lg font-semibold tracking-tight">My Assessments</h2>
          </div>
          <div className="glass-table overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Term</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Marks</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((a) => (
                  <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3.5 font-medium">{a.name}</td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm">{a.class.name}</span> <Badge variant="secondary" className="text-xs">{a.class.section}</Badge>
                    </td>
                    <td className="px-6 py-3.5">{a.subject.name}</td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground">{a.term.name}</td>
                    <td className="px-6 py-3.5 font-medium">
                      <Link href={`/teacher/exams/${a.id}/marks`} className="text-primary hover:underline">
                        {a._count.marks}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge variant={a.isPublished ? 'default' : 'outline'} className="font-medium">
                        {a.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/teacher/exams/${a.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-muted/50 transition-colors">
                          <SquarePen className="size-3" /> Edit
                        </Link>
                        <Link href={`/teacher/exams/${a.id}/marks`} className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium hover:bg-muted/50 transition-colors">
                          <PenLine className="size-3" /> Marks
                        </Link>
                        <TeacherAssessmentActions assessmentId={a.id} isPublished={a.isPublished} markCount={a._count.marks} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
