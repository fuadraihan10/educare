import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LayoutDashboard, BookOpen, Mail, Phone, GraduationCap, Briefcase, Calendar, User, Award } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { formatDate } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'My Profile' }

export default async function TeacherProfilePage() {
  const user = await requirePage('TEACHER')

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

  const info: { label: string; value: string; icon: typeof User }[] = [
    { label: 'Employee ID', value: teacher.employeeId, icon: Briefcase },
    { label: 'Designation', value: teacher.designation ?? '—', icon: Award },
    { label: 'Specialization', value: teacher.specialization ?? '—', icon: GraduationCap },
    { label: 'Qualification', value: teacher.qualification ?? '—', icon: BookOpen },
    { label: 'Gender', value: teacher.gender ? teacher.gender.toLowerCase() : '—', icon: User },
    { label: 'Date of Birth', value: teacher.dob ? formatDate(teacher.dob) : '—', icon: Calendar },
    { label: 'Phone', value: teacher.phone ?? '—', icon: Phone },
    { label: 'Email', value: teacher.email ?? '—', icon: Mail },
    { label: 'Join Date', value: formatDate(teacher.joinDate), icon: Calendar },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={teacher.name}
        subtitle={<><span className="font-mono">{teacher.employeeId}</span> · {teacher.designation ?? 'Teacher'}</>}
      >
        <Badge variant={teacher.status === 'ACTIVE' ? 'default' : 'secondary'} className="font-medium">{teacher.status}</Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="border-b border-border/50 px-6 py-4">
              <h2 className="text-lg font-semibold tracking-tight">Personal Information</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Your profile details</p>
            </div>
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {info.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="glass rounded-xl px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
                      <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <Icon className="size-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-medium uppercase tracking-wider text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-medium mt-0.5">{item.value}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Teaching Assignments</h2>
                <p className="text-sm text-muted-foreground mt-0.5">{teacher.assignments.length} assignment{teacher.assignments.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="p-6">
              {teacher.assignments.length === 0 ? (
                <EmptyState icon={BookOpen} title="No teaching assignments" description="You have no teaching assignments yet." />
              ) : (
                <ul className="space-y-2">
                  {teacher.assignments.map((a) => (
                    <li key={a.id} className="glass flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <BookOpen className="size-3.5 text-primary" />
                        </div>
                        <span className="font-medium">
                          {a.class.name} · Section {a.class.section} · {a.subject.name}
                        </span>
                      </div>
                      <span className="rounded-md bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">{a.academicYear.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl overflow-hidden h-fit">
            <div className="border-b border-border/50 px-6 py-4">
              <h2 className="text-lg font-semibold tracking-tight">Class Teacher Of</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Classes you supervise</p>
            </div>
            <div className="p-6 space-y-2">
              {teacher.classesTaught.length === 0 ? (
                <EmptyState icon={LayoutDashboard} title="Not assigned" description="You are not assigned as a class teacher." />
              ) : (
                teacher.classesTaught.map((c) => (
                  <div key={`${c.name}${c.section}${c.academicYear?.name ?? ''}`} className="glass flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <LayoutDashboard className="size-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.name} · Section {c.section}</p>
                      {c.academicYear && <p className="text-xs text-muted-foreground">{c.academicYear.name}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button variant="outline" nativeButton={false} render={<Link href="/teacher" />}>
            <LayoutDashboard /> Back to dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
