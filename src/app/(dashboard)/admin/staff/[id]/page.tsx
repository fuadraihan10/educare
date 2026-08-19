import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Pencil, ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getTeacher } from '@/lib/staff'
import { formatDate } from '@/lib/format'
import { StaffStatusButton } from '@/components/staff/staff-status-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = { title: 'Staff Profile' }

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
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={teacher.name}
        subtitle={<span className="font-mono text-xs">{teacher.employeeId}</span>}
        breadcrumb={
          <Link href="/admin/staff" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Staff
          </Link>
        }
      >
        <Badge variant={isActive ? 'default' : 'secondary'} className="text-xs">{teacher.status}</Badge>
        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/staff/${id}/edit`} />}>
          <Pencil /> Edit
        </Button>
        <StaffStatusButton staffId={id} active={isActive} />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-semibold">Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {info.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-semibold">Class Teacher Of</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {teacher.classesTaught.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Not assigned as a class teacher.</p>
              ) : (
                <ul className="space-y-2">
                  {teacher.classesTaught.map((c) => (
                    <li
                      key={`${c.name}${c.section}${c.academicYear?.name ?? ''}`}
                      className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/20 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <span className="font-medium">{c.name} · Section {c.section}</span>
                      {c.academicYear && <span className="text-xs text-muted-foreground">{c.academicYear.name}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
              <CardTitle className="text-base font-semibold">Teaching Assignments</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {teacher.assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No assignments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {teacher.assignments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-border/30 bg-muted/20 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                    >
                      <div>
                        <span className="font-medium">{a.class.name} · Section {a.class.section}</span>
                        <span className="text-muted-foreground ml-2">· {a.subject.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{a.academicYear.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden h-fit">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-semibold">Login Account</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 text-sm">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email</dt>
              <dd className="font-medium mt-0.5">{teacher.user?.email ?? 'No login account'}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</dt>
              <dd className="mt-0.5">
                {teacher.user ? (
                  <Badge variant={teacher.user.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
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
