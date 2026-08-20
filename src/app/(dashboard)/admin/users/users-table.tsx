'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AdminPasswordReset } from '@/components/users/admin-password-reset'
import { Shield, GraduationCap, UserRound, Users, KeyRound, AlertTriangle } from 'lucide-react'

const roleIcons: Record<string, typeof Shield> = {
  TEACHER: UserRound,
  STUDENT: GraduationCap,
  PARENT: Users,
}

const roleColors: Record<string, string> = {
  TEACHER: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  STUDENT: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  PARENT: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
}

type UserItem = {
  id: string
  name: string
  regNo: string
  email: string
  phone: string | null
  role: string
  status: string
  forcePasswordChange: boolean
  lastLoginAt: Date | null
  createdAt: Date
  teacher: { employeeId: string } | null
  student: { admissionNo: string; class: { name: string; section: string } | null } | null
}

export function UsersTable({ users }: { users: UserItem[] }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchesSearch = u.name.toLowerCase().includes(q) || u.regNo.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search by name, reg no, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-1.5">
          {['ALL', 'TEACHER', 'STUDENT', 'PARENT'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                roleFilter === r
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="glass-table overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Reg No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Password</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Last Login</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-muted-foreground">No users found.</td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const Icon = roleIcons[u.role] ?? Shield
                  return (
                    <tr key={u.id} className="border-b border-border/30 last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-full bg-muted/50 shrink-0">
                            <Icon className="size-3.5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{u.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs">{u.regNo}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${roleColors[u.role] ?? ''}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">{u.phone ?? '—'}</td>
                      <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground">
                        {u.teacher?.employeeId ?? u.student?.admissionNo ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={u.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">{u.status}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.forcePasswordChange ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <AlertTriangle className="size-3" />
                            Must change
                          </span>
                        ) : u.lastLoginAt ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                            <KeyRound className="size-3" />
                            Set
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <KeyRound className="size-3" />
                            Not logged in
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <AdminPasswordReset userId={u.id} userName={u.name} />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
