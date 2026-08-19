import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Shield, Check, X, Users, Lock, Eye } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { PageHeader } from '@/components/page-header'
import { PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/rbac'
import type { Role } from '@/generated/prisma/client'

export const metadata: Metadata = { title: 'Roles & Permissions' }

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrator',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
}

const roleDescriptions: Record<string, string> = {
  SUPER_ADMIN: 'Full system access with user management capabilities.',
  ADMIN: 'Administrative access to all modules except user management.',
  TEACHER: 'Access to academic features: classes, attendance, exams, and announcements.',
  STUDENT: 'Read-only access to academic information, attendance, and fees.',
  PARENT: 'Read-only access to view student information, attendance, and fees.',
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-500/10 text-purple-600 ring-purple-500/20',
  ADMIN: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
  TEACHER: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  STUDENT: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  PARENT: 'bg-rose-500/10 text-rose-600 ring-rose-500/20',
}

const moduleNames: Record<string, string> = {
  STUDENTS: 'Students',
  STAFF: 'Teachers & Staff',
  CLASSES: 'Classes',
  SUBJECTS: 'Subjects',
  ATTENDANCE: 'Attendance',
  EXAMS: 'Examinations',
  FEES: 'Fees & Payments',
  ANNOUNCEMENTS: 'Announcements',
  TIMETABLE: 'Timetable',
  SETTINGS: 'Settings',
  ADMISSIONS: 'Admissions',
  ANALYTICS: 'Analytics',
  USERS: 'User Management',
  AUDIT: 'Audit Logs',
  REPORTS: 'Reports',
}

const moduleIcons: Record<string, typeof Users> = {
  STUDENTS: Users,
  STAFF: Users,
  CLASSES: Users,
  SUBJECTS: Users,
  ATTENDANCE: Users,
  EXAMS: Users,
  FEES: Users,
  ANNOUNCEMENTS: Users,
  TIMETABLE: Users,
  SETTINGS: Lock,
  ADMISSIONS: Users,
  ANALYTICS: Eye,
  USERS: Shield,
  AUDIT: Eye,
  REPORTS: Eye,
}

const accessLevel = (perms: readonly string[]): string => {
  if (perms.length === 0) return 'none'
  if (perms.length <= 3) return 'read'
  if (perms.length <= 8) return 'standard'
  if (perms.length <= 20) return 'elevated'
  return 'full'
}

const accessColor: Record<string, string> = {
  none: 'bg-muted text-muted-foreground ring-border',
  read: 'bg-blue-500/10 text-blue-600 ring-blue-500/20',
  standard: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20',
  elevated: 'bg-amber-500/10 text-amber-600 ring-amber-500/20',
  full: 'bg-purple-500/10 text-purple-600 ring-purple-500/20',
}

const allRoles: Role[] = ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT']

export default async function PermissionsPage() {
  const user = await requirePage('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  const userPerms = ROLE_PERMISSIONS[user.role] ?? []
  const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'

  const totalPerms = Object.values(PERMISSIONS).reduce((acc, group) => acc + Object.values(group).length, 0)
  const grantedPerms = userPerms.length

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Roles & Permissions" subtitle="Your access level and permissions">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-2xl px-6 py-4 text-center">
          <p className="text-3xl font-bold">{grantedPerms}</p>
          <p className="text-xs text-muted-foreground mt-1">of {totalPerms} permissions granted</p>
        </div>
        <div className="glass-card rounded-2xl px-6 py-4 text-center">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${roleColors[user.role] ?? ''}`}>{roleLabel[user.role]}</span>
          <p className="text-xs text-muted-foreground mt-2">{roleDescriptions[user.role]}</p>
        </div>
        <div className="glass-card rounded-2xl px-6 py-4">
          <div className="w-full bg-muted rounded-full h-2.5 mb-2">
            <div className="bg-primary h-2.5 rounded-full transition-all" style={{ width: `${(grantedPerms / totalPerms) * 100}%` }} />
          </div>
          <p className="text-xs text-muted-foreground text-center">{Math.round((grantedPerms / totalPerms) * 100)}% access level</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Permission Details</h2>
              <p className="text-sm text-muted-foreground">Your {roleLabel[user.role]} permissions by module</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(PERMISSIONS).map(([group, perms]) => {
              const permValues = Object.values(perms)
              const granted = permValues.filter((p) => userPerms.includes(p))
              const level = accessLevel(granted)
              const Icon = moduleIcons[group] ?? Users

              return (
                <div key={group} className="glass rounded-xl px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-raised)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="size-3.5 text-muted-foreground" />
                      <p className="text-sm font-semibold">{moduleNames[group] ?? group}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${accessColor[level]}`}>{level}</span>
                  </div>
                  <div className="space-y-1">
                    {permValues.map((perm) => {
                      const granted = userPerms.includes(perm)
                      const action = perm.split('.').pop()!
                      return (
                        <div key={perm} className="flex items-center gap-1.5 text-xs">
                          {granted ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <X className="size-3 text-muted-foreground/50" />
                          )}
                          <span className={granted ? 'text-foreground' : 'text-muted-foreground/50'}>{action.toUpperCase()}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="border-b border-border/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-500/10 p-2">
                <Users className="size-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Role Comparison</h2>
                <p className="text-sm text-muted-foreground">Compare permissions across all roles</p>
              </div>
            </div>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">Module</th>
                  {allRoles.map((r) => (
                    <th key={r} className="text-center py-2 px-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${r === user.role ? roleColors[r] : 'bg-muted text-muted-foreground ring-border'}`}>{roleLabel[r]}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(PERMISSIONS).map(([group, perms]) => {
                  const permValues = Object.values(perms)
                  return permValues.map((perm, i) => (
                    <tr key={perm} className="border-b border-border/10 hover:bg-muted/30">
                      {i === 0 && (
                        <td rowSpan={permValues.length} className="py-1.5 px-3 text-xs font-semibold text-muted-foreground align-top">{moduleNames[group] ?? group}</td>
                      )}
                      <td className="py-1.5 px-3 text-center text-xs">{perm.split('.').pop()!.toUpperCase()}</td>
                      {allRoles.map((r) => {
                        const has = ROLE_PERMISSIONS[r]?.includes(perm)
                        return (
                          <td key={r} className="py-1.5 px-3 text-center">
                            {has ? <Check className="size-3.5 text-emerald-500 mx-auto" /> : <X className="size-3 text-muted-foreground/30 mx-auto" />}
                          </td>
                        )
                      })}
                    </tr>
                  ))
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
