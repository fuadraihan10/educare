import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listAcademicYears } from '@/lib/classes'
import { createClass } from '@/lib/classes/actions'
import { prisma } from '@/lib/db'
import { ClassForm } from '@/components/classes/class-form'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'New Class' }

export default async function NewClassPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  const [years, teachers] = await Promise.all([
    listAcademicYears(),
    prisma.teacher.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, employeeId: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Add Class"
        subtitle="Create a new class section for an academic year."
        breadcrumb={
          <Link href="/admin/classes" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Classes
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Class Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ClassForm
            action={createClass}
            submitLabel="Create Class"
            years={years}
            teachers={teachers}
          />
        </CardContent>
      </Card>
    </div>
  )
}
