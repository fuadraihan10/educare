import type { Metadata } from 'next'
import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { getStudentGrades } from '@/lib/exams'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { StatCard } from '@/components/stat-card'
import { GraduationCap, Award, TrendingUp, AlertCircle, BarChart3, BookOpen } from 'lucide-react'

export const metadata: Metadata = { title: 'My Grades' }

export default async function StudentGradesPage() {
  const user = await requirePage('STUDENT')
  const student = await prisma.student.findUnique({ where: { userId: user.id }, select: { id: true } })
  if (!student) return <EmptyState icon={AlertCircle} title="Student profile not found" description="Your student profile could not be loaded." />

  const marks = await getStudentGrades(student.id)

  const totalObtained = marks.reduce((sum, m) => sum + Number(m.marksObtained), 0)
  const totalMax = marks.reduce((sum, m) => sum + Number(m.assessment.maxMarks), 0)

  const groupedBySubject = marks.reduce<Record<string, typeof marks>>((acc, m) => {
    const key = m.assessment.subject.name
    ;(acc[key] ??= []).push(m)
    return acc
  }, {})

  const subjectGpas = Object.entries(groupedBySubject).map(([subject, subjectMarks]) => {
    const totalPoints = subjectMarks.reduce((s, m) => s + (m.gradePoint ? Number(m.gradePoint) : 0), 0)
    const gpa = subjectMarks.length > 0 ? totalPoints / subjectMarks.length : 0
    return { subject, gpa, marks: subjectMarks }
  })

  const overallGpa = subjectGpas.length > 0
    ? subjectGpas.reduce((s, sg) => s + sg.gpa, 0) / subjectGpas.length
    : 0

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="My Results" subtitle="Published assessment results." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Assessments" value={marks.length} icon={BarChart3} iconColor="bg-blue-500/10" />
        <StatCard title="Total Marks" value={`${totalObtained} / ${totalMax}`} icon={Award} iconColor="bg-emerald-500/10" />
        <StatCard title="Overall GPA" value={overallGpa.toFixed(2)} icon={TrendingUp} iconColor="bg-violet-500/10" subtitle="Out of 5.00" />
        <StatCard title="Subjects" value={Object.keys(groupedBySubject).length} icon={BookOpen} iconColor="bg-amber-500/10" subtitle={`${subjectGpas.filter((s) => s.gpa >= 5.0).length} with A+`} />
      </div>

      {marks.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No results published yet" description="Your assessment results will appear here once published." />
      ) : (
        <div className="space-y-6">
          {subjectGpas.map(({ subject, gpa, marks: subjectMarks }) => (
            <div key={subject} className="glass-card rounded-2xl overflow-hidden">
              <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">{subject}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{subjectMarks.length} assessment{subjectMarks.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="font-medium">
                    GPA: {gpa.toFixed(2)}
                  </Badge>
                </div>
              </div>
              <div className="glass-table overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Assessment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Term</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Marks</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Grade Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectMarks.map((m) => (
                      <tr key={m.id} className="border-b border-border/30 last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-3.5 font-medium">{m.assessment.name}</td>
                        <td className="px-6 py-3.5 text-xs text-muted-foreground">{m.assessment.term.name}</td>
                        <td className="px-6 py-3.5">{String(m.marksObtained)} / {String(m.assessment.maxMarks)}</td>
                        <td className="px-6 py-3.5">
                          <Badge variant={m.grade === 'F' ? 'destructive' : m.grade === 'A+' || m.grade === 'A' ? 'default' : 'secondary'} className="font-medium">{m.grade ?? '—'}</Badge>
                        </td>
                        <td className="px-6 py-3.5 font-medium tabular-nums">{m.gradePoint != null ? Number(m.gradePoint).toFixed(1) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
