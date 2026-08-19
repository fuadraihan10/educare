import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { createStudent } from '@/lib/students/actions'
import { StudentForm } from '@/components/students/student-form'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = { title: 'New Student' }

export default async function NewStudentPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  const classes = await prisma.class.findMany({
    where: { academicYear: { isActive: true } },
    select: { id: true, name: true, section: true },
    orderBy: [{ name: 'asc' }, { section: 'asc' }],
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Add Student"
        subtitle="A unique admission number is generated automatically."
        breadcrumb={
          <Link href="/admin/students" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Students
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Student Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <StudentForm action={createStudent} classes={classes} submitLabel="Create Student" />
        </CardContent>
      </Card>
    </div>
  )
}
