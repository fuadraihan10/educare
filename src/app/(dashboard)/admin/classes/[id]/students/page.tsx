import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, Users } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getStudentsByClass } from '@/lib/classes'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Class Students' }

const PAGE_SIZE = 50

export default async function ClassStudentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const { students, total, cls } = await getStudentsByClass(id, { page, pageSize: PAGE_SIZE })
  if (!cls) notFound()
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function href(p: number) {
    const sp = new URLSearchParams()
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/admin/classes/${id}/students${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={cls.name}
        subtitle={<>Section {cls.section} — {total} student{total === 1 ? '' : 's'} enrolled</>}
        breadcrumb={
          <Link href={`/admin/classes/${id}`} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> {cls.name} — Section {cls.section}
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="size-4" /> All Students
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="No students" description="No students are enrolled in this class." />
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {students.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6 text-right">{(page - 1) * PAGE_SIZE + i + 1}</span>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {s.rollNo ?? '—'}
                    </div>
                    <div>
                      <Link href={`/admin/students/${s.id}`} className="text-sm font-medium underline underline-offset-2 hover:text-primary">
                        {s.firstName} {s.lastName}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground font-mono">{s.admissionNo}</span>
                        {s.user && (
                          <span className="text-xs text-muted-foreground font-mono">{s.user.regNo}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {s.rollNo != null && (
                    <span className="text-xs text-muted-foreground">Roll {s.rollNo}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {page > 1 && <PaginationItem><PaginationPrevious href={href(page - 1)} /></PaginationItem>}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}><PaginationLink href={href(p)} isActive={p === page}>{p}</PaginationLink></PaginationItem>
            ))}
            {page < totalPages && <PaginationItem><PaginationNext href={href(page + 1)} /></PaginationItem>}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
