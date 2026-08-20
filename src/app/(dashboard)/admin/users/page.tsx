import type { Metadata } from 'next'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/page-header'
import { StatCard } from '@/components/stat-card'
import { UsersTable } from './users-table'
import { UserRound, GraduationCap, Users, Shield } from 'lucide-react'

export const metadata: Metadata = { title: 'User Management' }

export default async function UsersPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  const users = await prisma.user.findMany({
    where: { role: { in: ['TEACHER', 'STUDENT', 'PARENT'] } },
    select: {
      id: true,
      name: true,
      regNo: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      forcePasswordChange: true,
      lastLoginAt: true,
      createdAt: true,
      teacher: { select: { employeeId: true } },
      student: { select: { admissionNo: true, class: { select: { name: true, section: true } } } },
    },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
  })

  const teachers = users.filter((u) => u.role === 'TEACHER').length
  const students = users.filter((u) => u.role === 'STUDENT').length
  const parents = users.filter((u) => u.role === 'PARENT').length

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} user(s) — Teachers, Students & Parents`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={users.length} icon={Shield} iconColor="bg-blue-500/10" />
        <StatCard title="Teachers" value={teachers} icon={UserRound} iconColor="bg-emerald-500/10" />
        <StatCard title="Students" value={students} icon={GraduationCap} iconColor="bg-violet-500/10" />
        <StatCard title="Parents" value={parents} icon={Users} iconColor="bg-amber-500/10" />
      </div>

      <UsersTable users={users} />
    </div>
  )
}
