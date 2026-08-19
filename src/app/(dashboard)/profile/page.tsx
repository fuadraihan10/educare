import type { Metadata } from 'next'
import Link from 'next/link'
import {
  User, Shield, Calendar, Clock, Phone,
  Bell, Palette, Lock, Activity, ChevronRight, Award, GraduationCap
} from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/page-header'
import { formatDate } from '@/lib/format'

export const metadata: Metadata = { title: 'My Profile' }

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
}

const roleColor: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500/10 text-purple-600 ring-purple-500/20',
  ADMIN: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
  TEACHER: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  STUDENT: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  PARENT: 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
}

const roleBg: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  ADMIN: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  TEACHER: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  STUDENT: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  PARENT: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')
}

const navItems = [
  { href: '/profile/edit', label: 'Edit Profile', icon: User, description: 'Update your personal information' },
  { href: '/profile/security', label: 'Password & Security', icon: Lock, description: 'Change password and manage security' },
  { href: '/profile/notifications', label: 'Notifications', icon: Bell, description: 'Configure notification preferences' },
  { href: '/profile/appearance', label: 'Appearance', icon: Palette, description: 'Theme, density, and display settings' },
  { href: '/profile/sessions', label: 'Active Sessions', icon: Clock, description: 'Manage your login sessions' },
  { href: '/profile/activity', label: 'Activity Log', icon: Activity, description: 'View your account activity' },
  { href: '/profile/permissions', label: 'Roles & Permissions', icon: Shield, description: 'Your access level and permissions' },
]

export default async function ProfilePage() {
  const user = await requirePage('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')

  const [student, teacher] = await Promise.all([
    user.role === 'STUDENT' ? prisma.student.findUnique({
      where: { userId: user.id },
      select: { admissionNo: true, class: { select: { name: true, section: true } } },
    }) : null,
    user.role === 'TEACHER' ? prisma.teacher.findUnique({
      where: { userId: user.id },
      select: { employeeId: true, designation: true },
    }) : null,
  ])

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="My Account" subtitle="Manage your profile, security, and preferences" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="glass-card rounded-2xl overflow-hidden lg:row-span-2">
          <div className="flex flex-col items-center gap-4 px-6 py-8 text-center border-b border-border/50">
            <div className="relative">
              <div className={`flex size-24 items-center justify-center rounded-2xl text-3xl font-bold ${roleBg[user.role] ?? 'bg-muted/30 text-muted-foreground'}`}>
                {initials(user.name)}
              </div>
              <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center">
                <div className="size-2 rounded-full bg-white" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{user.name}</h2>
              <p className="text-[11px] font-mono text-muted-foreground">{user.regNo}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${roleColor[user.role] ?? 'bg-muted text-muted-foreground ring-border'}`}>
                {roleLabel[user.role] ?? user.role}
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 px-3 py-1 text-xs font-semibold">
                {user.status}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2 text-sm">
            {user.phone && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground">
                <Phone className="size-4" />
                <span>{user.phone}</span>
              </div>
            )}
            {student && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground">
                <GraduationCap className="size-4" />
                <span>{student.class?.name} {student.class?.section} · #{student.admissionNo}</span>
              </div>
            )}
            {teacher && (
              <>
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground">
                  <Award className="size-4" />
                  <span>{teacher.employeeId} · {teacher.designation ?? 'Teacher'}</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground">
              <Calendar className="size-4" />
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground">
              <Clock className="size-4" />
              <span>Last login {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">Account Settings</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="glass flex items-center gap-4 rounded-xl px-4 py-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)] group">
                <div className="rounded-lg bg-primary/10 p-2.5 shrink-0 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="size-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0 group-hover:text-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
