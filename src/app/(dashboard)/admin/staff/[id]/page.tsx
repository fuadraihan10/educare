import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Pencil } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getTeacher } from '@/lib/staff'
import { formatDate } from '@/lib/format'
import { StaffStatusButton } from '@/components/staff/staff-status-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params

  const teacher = await getTeacher(id)
  if (!teacher) notFound()

  const isActive = teacher.status === 'ACTIVE'

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
            <span className="font-mono">{teacher.employeeId}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isActive ? 'default' : 'secondary'}>{teacher.status}</Badge>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/staff/${id}/edit`} />}>
            <Pencil /> Edit
          </Button>
          <StaffStatusButton staffId={id} active={isActive} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
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
              <CardTitle>Class teacher of</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.classesTaught.length === 0 ? (
                <p className="text-sm text-muted-foreground">Not assigned as a class teacher.</p>
              ) : (
                <ul className="space-y-2">
                  {teacher.classesTaught.map((c) => (
                    <li key={`${c.name}${c.section}${c.academicYear?.name ?? ''}`} className="text-sm">
                      {c.name} {c.section}
                      {c.academicYear ? ` — ${c.academicYear.name}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Teaching assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assignments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {teacher.assignments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
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
            <CardTitle>Login account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="font-medium">{teacher.user?.email ?? 'No login account'}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status</dt>
              <dd>
                {teacher.user ? (
                  <Badge variant={teacher.user.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {teacher.user.status}
                  </Badge>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
