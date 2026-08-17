import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LayoutDashboard } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TeacherProfilePage() {
  const user = await requirePage('TEACHER')

  // A teacher always sees only their own record — looked up by session user id,
  // never by a path parameter, so no teacher can view another's profile.
  const teacher = await prisma.teacher.findUnique({
    where: { userId: user.id },
    include: {
      assignments: {
        orderBy: [{ academicYear: { startDate: 'desc' } }],
        take: 20,
        include: {
          class: { select: { name: true, section: true } },
          subject: { select: { name: true } },
          academicYear: { select: { name: true } },
        },
      },
      classesTaught: {
        select: { name: true, section: true, academicYear: { select: { name: true } } },
      },
    },
  })
  if (!teacher) notFound()

  const info: [string, string][] = [
    ['Employee ID', teacher.employeeId],
    ['Designation', teacher.designation ?? '—'],
    ['Specialization', teacher.specialization ?? '—'],
    ['Qualification', teacher.qualification ?? '—'],
    ['Gender', teacher.gender ? teacher.gender.toLowerCase() : '—'],
    ['Date of birth', teacher.dob ? formatDate(teacher.dob) : '—'],
    ['Phone', teacher.phone ?? '—'],
    ['Email', teacher.email ?? '—'],
    ['Join date', formatDate(teacher.joinDate)],
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{teacher.name}</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{teacher.employeeId}</span> · {teacher.designation ?? 'Teacher'}
          </p>
        </div>
        <Badge>{teacher.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>My profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {info.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No teaching assignments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {teacher.assignments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span>
                        {a.class.name} {a.class.section} · {a.subject.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{a.academicYear.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Class teacher of</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {teacher.classesTaught.length === 0 ? (
              <p className="text-muted-foreground">Not assigned as a class teacher.</p>
            ) : (
              teacher.classesTaught.map((c) => (
                <div key={`${c.name}${c.section}${c.academicYear?.name ?? ''}`}>
                  {c.name} {c.section}
                  {c.academicYear ? ` — ${c.academicYear.name}` : ''}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Button variant="outline" nativeButton={false} render={<Link href="/teacher" />}>
        <LayoutDashboard /> Back to dashboard
      </Button>
    </div>
  )
}
