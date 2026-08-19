import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getClass, listAcademicYears } from '@/lib/classes'
import { prisma } from '@/lib/db'
import { updateClass } from '@/lib/classes/actions'
import { ClassForm, type ClassFormInitial } from '@/components/classes/class-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = { title: 'Edit Class' }

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params

  const [cls, years, teachers] = await Promise.all([
    getClass(id),
    listAcademicYears(),
    prisma.teacher.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, employeeId: true },
      orderBy: { name: 'asc' },
    }),
  ])
  if (!cls) notFound()

  const initial: ClassFormInitial = {
    name: cls.name,
    section: cls.section,
    code: cls.code,
    room: cls.room,
    academicYearId: cls.academicYear.id,
    classTeacherId: cls.classTeacher?.id ?? null,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`Edit ${cls.name}`}
        subtitle={<>Section {cls.section}</>}
        breadcrumb={
          <Link href={`/admin/classes/${id}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> {cls.name} — {cls.section}
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Class Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ClassForm
            action={updateClass.bind(null, id)}
            initial={initial}
            submitLabel="Save changes"
            years={years}
            teachers={teachers}
          />
        </CardContent>
      </Card>
    </div>
  )
}
