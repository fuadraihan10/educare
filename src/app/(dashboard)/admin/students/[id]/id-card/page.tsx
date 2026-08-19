import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { getStudent, fullName, formatDate } from '@/lib/students'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/page-header'
import { PrintButton } from './print-button'

export const metadata: Metadata = { title: 'ID Card' }

export default async function StudentIdCardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params

  const [student, school] = await Promise.all([
    getStudent(id),
    prisma.school.findFirst({
      select: { name: true, shortName: true, address: true, city: true, phone: true },
    }),
  ])
  if (!student) notFound()

  const initials = fullName(student)
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

  return (
    <div className="space-y-6 animate-fade-in print:space-y-0">
      <PageHeader
        title="Student ID Card"
        subtitle={<span className="font-mono text-xs">{student.admissionNo}</span>}
        breadcrumb={
          <Link href={`/admin/students/${id}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> {fullName(student)}
          </Link>
        }
      >
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href={`/admin/students/${id}`} />}
        >
          <ArrowLeft /> Back
        </Button>
        <PrintButton />
      </PageHeader>

      <div className="flex justify-center print:justify-center">
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-raised-lg)] print:shadow-none print:border print:max-w-[3.5in] print:rounded-lg">
          <div className="bg-gradient-to-br from-primary via-primary to-primary/70 px-6 py-5 text-primary-foreground print:bg-primary relative overflow-hidden">
            <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 size-16 rounded-full bg-white/10" />
            <p className="text-lg font-bold leading-tight tracking-tight relative z-10">{school?.name ?? 'School'}</p>
            <p className="text-[10px] opacity-90 tracking-[0.2em] uppercase mt-1 relative z-10">Student Identity Card</p>
          </div>
          <div className="space-y-5 px-6 py-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 min-w-0 flex-1">
                <div>
                  <p className="text-base font-bold tracking-tight">{fullName(student)}</p>
                  <p className="text-xs text-muted-foreground">Student</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Admission No</p>
                    <p className="font-mono text-xs font-semibold">{student.admissionNo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Class</p>
                    <p className="font-medium text-sm">
                      {student.class ? `${student.class.name} · Section ${student.class.section}` : 'Unassigned'}
                      {student.rollNo ? ` · Roll ${student.rollNo}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Blood Group</p>
                    <p className="font-medium text-sm">{student.bloodGroup ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Date of Birth</p>
                    <p className="font-medium text-sm">{formatDate(student.dob)}</p>
                  </div>
                </div>
              </div>
              <div className="shrink-0 overflow-hidden rounded-xl border-2 border-border shadow-[var(--shadow-subtle)]">
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
                  <div className="flex h-28 w-24 items-center justify-center bg-gradient-to-br from-muted to-muted/50 text-2xl font-semibold text-muted-foreground">
                    {initials}
                  </div>
                )}
              </div>
            </div>
            <Separator className="opacity-50" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="font-semibold">{school?.shortName ?? 'SMS'}</span>
              <span>{school?.phone ?? ''}</span>
              <span className="text-right">{[school?.address, school?.city].filter(Boolean).join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          @page { size: auto; margin: 0.5in; }
        }
      `}</style>
    </div>
  )
}
