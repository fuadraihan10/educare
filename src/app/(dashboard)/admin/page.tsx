import type { Metadata } from 'next'
import { Users, UserRound, School, ClipboardList, GraduationCap, UserCog, BookOpen, FileCheck, CalendarCheck, DollarSign, BarChart3, Settings } from 'lucide-react'
import Link from 'next/link'
import dayjs from 'dayjs'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { StatCard } from '@/components/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function AdminDashboard() {
  const user = await requirePage('SUPER_ADMIN', 'ADMIN')

  const now = new Date()
  const startOfMonth = dayjs(now).startOf('month').toDate()

  const [studentCount, teacherCount, classCount, applicationCount, newThisMonth] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.admissionApplication.count({ where: { status: 'PENDING' } }),
    prisma.student.count({ where: { createdAt: { gte: startOfMonth } } }),
  ])

  const staggerClasses = ['stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5', 'stagger-6', 'stagger-7', 'stagger-8']
  const dateSubtitle = dayjs(now).format('dddd, MMMM D')
  const roleBadge = user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'

  const links = [
    { href: '/admin/students', label: 'Students', desc: 'Manage student records', icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { href: '/admin/staff', label: 'Staff', desc: 'Teacher & staff directory', icon: UserCog, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10' },
    { href: '/admin/classes', label: 'Classes', desc: 'Sections & schedules', icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { href: '/admin/admissions', label: 'Admissions', desc: 'Review applications', icon: FileCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { href: '/admin/attendance', label: 'Attendance', desc: 'Mark & view records', icon: CalendarCheck, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
    { href: '/admin/fees', label: 'Fees', desc: 'Invoices & payments', icon: DollarSign, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10' },
    { href: '/admin/analytics', label: 'Analytics', desc: 'Reports & insights', icon: BarChart3, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
    { href: '/admin/settings', label: 'Settings', desc: 'School configuration', icon: Settings, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">Dashboard</h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <span className="text-sm text-muted-foreground">{dateSubtitle}</span>
            <Badge variant="secondary">{roleBadge}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Students"
          value={studentCount}
          icon={Users}
          iconColor="bg-blue-500/10"
          subtitle="Total enrolled"
          className="animate-fade-in stagger-1"
          trend={newThisMonth > 0 ? { value: newThisMonth, label: 'new this month' } : undefined}
        />
        <StatCard title="Teachers" value={teacherCount} icon={UserRound} iconColor="bg-violet-500/10" subtitle="Active staff" className="animate-fade-in stagger-2" />
        <StatCard title="Classes" value={classCount} icon={School} iconColor="bg-emerald-500/10" subtitle="Current year" className="animate-fade-in stagger-3" />
        <StatCard title="Pending admissions" value={applicationCount} icon={ClipboardList} iconColor="bg-amber-500/10" subtitle={applicationCount > 0 ? 'Needs review' : 'All clear'} className="animate-fade-in stagger-4" />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">Quick actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {links.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                className={`glass-card group relative flex flex-col items-center gap-3 rounded-xl p-6 text-center text-sm font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:text-foreground border border-border/50 animate-fade-in ${staggerClasses[i]}`}
              >
                <div className={`rounded-xl ${l.bg} p-3 transition-transform duration-200 group-hover:scale-105`}>
                  <l.icon className={`size-5 ${l.color}`} />
                </div>
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">{l.label}</div>
                  <div className="text-[11px] text-muted-foreground">{l.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
