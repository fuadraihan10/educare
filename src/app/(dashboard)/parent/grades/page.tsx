import type { Metadata } from 'next'
import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { getStudentGrades } from '@/lib/exams'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { StatCard } from '@/components/stat-card'
import { GraduationCap, AlertCircle, Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Results' }

export default async function ParentGradesPage() {
  const user = await requirePage('PARENT')
  const links = await prisma.studentGuardian.findMany({
    where: { parentUserId: user.id },
    select: { student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } } },
  })
  if (links.length === 0) return <EmptyState icon={AlertCircle} title="No linked students found" description="No students are linked to your parent account." />

  const allGrades = await Promise.all(
    links.map(async ({ student }) => {
      const marks = await getStudentGrades(student.id)
      const subjectMap = new Map<string, typeof marks>()
      for (const m of marks) {
        const key = m.assessment.subject.name
        if (!subjectMap.has(key)) subjectMap.set(key, [])
        subjectMap.get(key)!.push(m)
      }
      let totalPoints = 0
      let subjectCount = 0
      for (const [, subjMarks] of subjectMap) {
        const avg = subjMarks.reduce((s, m) => s + (m.gradePoint ? Number(m.gradePoint) : 0), 0) / subjMarks.length
        totalPoints += avg
        subjectCount++
      }
      const gpa = subjectCount > 0 ? totalPoints / subjectCount : 0
      return { student, marks, gpa }
    }),
  )

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Results" subtitle="Published assessment results for your children." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Children" value={links.length} icon={Users} iconColor="bg-blue-500/10" subtitle="Linked students" />
        {allGrades.map(({ student, marks, gpa }) => (
          <StatCard key={student.id} title={`${student.firstName} ${student.lastName}`} value={`${gpa.toFixed(2)} / 5.00`} icon={GraduationCap} iconColor="bg-emerald-500/10" subtitle={`${marks.length} assessment(s)`} />
        ))}
      </div>

      {allGrades.map(({ student, marks }) => (
        <div key={student.id} className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight">{student.firstName} {student.lastName}</h2>
            <Badge variant="secondary" className="font-mono text-xs">#{student.admissionNo}</Badge>
          </div>

          {marks.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No results published yet" description="Assessment results will appear here once published." />
          ) : (
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="border-b border-border/50 px-6 py-4">
                <h2 className="text-lg font-semibold tracking-tight">Results</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{marks.length} assessment(s)</p>
              </div>
              <div className="glass-table overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Assessment</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Term</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Marks</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Grade</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">GP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.map((m) => (
                      <tr key={m.id} className="border-b border-border/30 last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-3.5 font-medium">{m.assessment.name}</td>
                        <td className="px-6 py-3.5">{m.assessment.subject.name}</td>
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
          )}
        </div>
      ))}
    </div>
  )
}
