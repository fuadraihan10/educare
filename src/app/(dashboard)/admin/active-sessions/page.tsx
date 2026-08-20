import type { Metadata } from 'next'
import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/page-header'
import { ActiveSessionsTable } from './active-sessions-table'

export const metadata: Metadata = { title: 'Active Sessions' }

export default async function ActiveSessionsPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  const sessions = await prisma.userSession.findMany({
    where: { expiresAt: { gt: new Date() } },
    include: {
      user: { select: { id: true, name: true, regNo: true, role: true, email: true } },
    },
    orderBy: { lastActiveAt: 'desc' },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Active Sessions"
        subtitle={`Monitor and manage all user sessions across the system`}
      />
      <ActiveSessionsTable
        sessions={sessions.map((s) => ({
          id: s.id,
          userId: s.user.id,
          userName: s.user.name,
          userRegNo: s.user.regNo,
          userRole: s.user.role,
          userEmail: s.user.email,
          browser: s.browser,
          os: s.os,
          device: s.device,
          ipAddress: s.ipAddress,
          lastActiveAt: s.lastActiveAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
          createdAt: s.createdAt.toISOString(),
        }))}
      />
    </div>
  )
}
