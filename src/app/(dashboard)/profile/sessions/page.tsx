import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/page-header'
import { SessionsManager } from './sessions-manager'

export const metadata: Metadata = { title: 'Active Sessions' }

export default async function SessionsPage() {
  const user = await requirePage('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  const session = await auth()
  const sessions = await prisma.userSession.findMany({ where: { userId: user.id }, orderBy: { lastActiveAt: 'desc' } })

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Active Sessions" subtitle="See where you're signed in and manage your sessions">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </PageHeader>

      <SessionsManager
        currentSessionId={session?.user?.sessionId as string | undefined}
        sessions={sessions.map((s) => ({
          ...s,
          createdAt: s.createdAt.toISOString(),
          lastActiveAt: s.lastActiveAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
        }))}
      />
    </div>
  )
}
