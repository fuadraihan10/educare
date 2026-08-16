import Link from 'next/link'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'

export default async function ParentDashboard() {
  const user = await requirePage('PARENT')

  const children = await prisma.studentGuardian.findMany({
    where: { parentUserId: user.id },
    include: {
      student: {
        include: { class: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-sm text-muted-foreground">Your children at a glance.</p>
      </div>

      {children.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            No children are linked to this account yet. Contact the school office.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {children.map(async ({ student }) => {
          const [attendanceTotal, attendancePresent, marksAgg] = await Promise.all([
            prisma.attendance.count({ where: { studentId: student.id } }),
            prisma.attendance.count({
              where: { studentId: student.id, status: { in: ['PRESENT', 'LATE'] } },
            }),
            prisma.mark.aggregate({
              where: { studentId: student.id, assessment: { isPublished: true } },
              _avg: { marksObtained: true },
            }),
          ])
          const attendancePct = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : null
          const avg = marksAgg._avg.marksObtained

          return (
            <Card key={student.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="size-5 text-muted-foreground" />
                  {student.firstName} {student.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="text-muted-foreground">
                  {student.class?.name} {student.class?.section} · Roll {student.rollNo}
                </p>
                <p>
                  Attendance: <span className="font-medium">{attendancePct === null ? '—' : `${attendancePct}%`}</span>
                  {avg !== null && (
                    <>
                      {' · '}Average: <span className="font-medium">{Math.round(Number(avg))}%</span>
                    </>
                  )}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" render={<Link href="/parent/attendance" />}>Attendance</Button>
                  <Button variant="outline" size="sm" render={<Link href="/parent/grades" />}>Results</Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
