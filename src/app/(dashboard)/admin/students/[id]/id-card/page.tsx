import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { getStudent, fullName, formatDate } from '@/lib/students'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PrintButton } from '@/components/students/print-button'

export default async function StudentIdCardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params

  const student = await getStudent(id)
  if (!student) notFound()

  const school = await prisma.school.findFirst({
    select: { name: true, shortName: true, address: true, city: true, phone: true },
  })

  return (
    <div className="space-y-6 print:space-y-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/admin/students/${id}`} />}>
          <ArrowLeft /> Back
        </Button>
        <PrintButton />
      </div>

      <div className="flex justify-center">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
          <div className="bg-primary px-5 py-3 text-primary-foreground">
            <p className="text-lg font-semibold leading-tight">{school?.name ?? 'School'}</p>
            <p className="text-xs opacity-90">Student Identity Card</p>
          </div>
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold">{fullName(student)}</p>
                  <p className="text-xs text-muted-foreground">Student</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-xs text-muted-foreground">Admission No</span>
                    <br />
                    <span className="font-mono text-xs font-semibold">{student.admissionNo}</span>
                  </p>
                  <p>
                    <span className="text-xs text-muted-foreground">Class</span>
                    <br />
                    <span className="font-medium">
                      {student.class ? `${student.class.name} ${student.class.section}` : 'Unassigned'}
                      {student.rollNo ? ` · Roll ${student.rollNo}` : ''}
                    </span>
                  </p>
                  <p>
                    <span className="text-xs text-muted-foreground">Blood group</span>
                    <br />
                    <span className="font-medium">{student.bloodGroup ?? '—'}</span>
                  </p>
                  <p>
                    <span className="text-xs text-muted-foreground">Date of birth</span>
                    <br />
                    <span className="font-medium">{formatDate(student.dob)}</span>
                  </p>
                </div>
              </div>
              <div className="shrink-0 overflow-hidden rounded-xl border">
                {student.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/uploads/${student.photoUrl}`}
                    alt={fullName(student)}
                    width={96}
                    height={112}
                    className="h-28 w-24 object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-24 items-center justify-center bg-muted text-2xl font-semibold text-muted-foreground">
                    {fullName(student)
                      .split(' ')
                      .slice(0, 2)
                      .map((p) => p[0]!.toUpperCase())
                      .join('')}
                  </div>
                )}
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{school?.shortName ?? 'SMS'}</span>
              <span>{school?.phone ?? ''}</span>
              <span>{[school?.address, school?.city].filter(Boolean).join(', ')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
