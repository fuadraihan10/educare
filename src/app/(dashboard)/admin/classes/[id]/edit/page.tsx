import { notFound } from 'next/navigation'

import { requirePage } from '@/lib/permissions'
import { getClass, listAcademicYears } from '@/lib/classes'
import { prisma } from '@/lib/db'
import { updateClass } from '@/lib/classes/actions'
import { ClassForm, type ClassFormInitial } from '@/components/classes/class-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit {cls.name} — Section {cls.section}
        </h1>
        <p className="text-sm text-muted-foreground">
          <span className="font-mono">{cls.code}</span>
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Class details</CardTitle>
        </CardHeader>
        <CardContent>
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
