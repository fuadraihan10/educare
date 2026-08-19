import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { PageHeader } from '@/components/page-header'
import { AppearanceForm } from './appearance-form'

export const metadata: Metadata = { title: 'Appearance' }

export default async function AppearancePage() {
  const user = await requirePage('SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT')
  const preferences = await prisma.userPreference.findUnique({ where: { userId: user.id } })

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Appearance" subtitle="Customize how the app looks and feels">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" /> Back
        </Link>
      </PageHeader>
      <AppearanceForm preferences={preferences} />
    </div>
  )
}
