import { Users, UserRound, School, ClipboardList } from 'lucide-react'
import Link from 'next/link'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { StatCard } from '@/components/stat-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboard() {
  const user = await requirePage('SUPER_ADMIN', 'ADMIN')

  const [studentCount, teacherCount, classCount, applicationCount] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.admissionApplication.count({ where: { status: 'PENDING' } }),
  ])

  const links = [
    { href: '/admin/students', label: 'Students' },
    { href: '/admin/staff', label: 'Staff' },
    { href: '/admin/classes', label: 'Classes' },
    { href: '/admin/admissions', label: 'Admissions' },
    { href: '/admin/attendance', label: 'Attendance' },
    { href: '/admin/fees', label: 'Fees' },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/settings', label: 'Settings' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-sm text-muted-foreground">School overview at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Students" value={studentCount} icon={Users} />
        <StatCard title="Teachers" value={teacherCount} icon={UserRound} />
        <StatCard title="Classes" value={classCount} icon={School} />
        <StatCard title="Pending admissions" value={applicationCount} icon={ClipboardList} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Button key={l.href} variant="outline" render={<Link href={l.href} />}>
              {l.label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
