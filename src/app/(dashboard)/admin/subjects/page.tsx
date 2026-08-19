import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, Plus, BookOpen } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listSubjects } from '@/lib/subjects'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Subjects' }

const PAGE_SIZE = 20

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const page = Math.max(1, Number(params.page) || 1)

  const { subjects, total } = await listSubjects({ q, page, pageSize: PAGE_SIZE })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function href(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/admin/subjects${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Subjects"
        subtitle={`${total} subject${total === 1 ? '' : 's'}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" render={<Link href="/admin/subjects/assignments" />}>Assignments</Button>
            <Button render={<Link href="/admin/subjects/new" />}><Plus /> Add subject</Button>
          </div>
        }
      />

      <form action="/admin/subjects" method="GET" className="flex flex-wrap items-end gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search by name or code…" className="pl-9" aria-label="Search subjects" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-lg">Subject list</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Assignments</TableHead>
                <TableHead>Assessments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  <EmptyState
                    icon={BookOpen}
                    title="No subjects found"
                    description="There are no subjects matching your criteria."
                  />
                </TableCell></TableRow>
              )}
              {subjects.map((s) => (
                <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs">{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.description ?? '—'}</TableCell>
                  <TableCell><Badge variant="secondary">{s._count.assignments}</Badge></TableCell>
                  <TableCell><Badge variant="secondary">{s._count.assessments}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/subjects/${s.id}`} />}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
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
