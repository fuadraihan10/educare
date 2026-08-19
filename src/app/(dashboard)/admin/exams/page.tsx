import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, Plus, ClipboardList } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listAssessments } from '@/lib/exams'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Exams' }

const PAGE_SIZE = 20

export default async function ExamsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const page = Math.max(1, Number(params.page) || 1)
  const { assessments, total } = await listAssessments({ q, page, pageSize: PAGE_SIZE })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function href(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/admin/exams${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Exams & Grades"
        subtitle={`${total} assessment${total === 1 ? '' : 's'}`}
        action={<Button render={<Link href="/admin/exams/new" />}><Plus /> New assessment</Button>}
      />
      <form action="/admin/exams" method="GET" className="flex flex-wrap items-end gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search assessments…" className="pl-9" aria-label="Search exams" />
        </div>
        <Button type="submit" variant="outline">Search</Button>
      </form>
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-lg">Assessments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                <EmptyState
                  icon={ClipboardList}
                  title="No assessments found"
                  description="There are no assessments matching your criteria."
                />
              </TableCell></TableRow>}
              {assessments.map((a) => (
                <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell><span className="text-sm">{a.class.name}</span> <Badge variant="secondary" className="text-xs">{a.class.section}</Badge></TableCell>
                  <TableCell className="text-sm">{a.subject.name}</TableCell>
                  <TableCell className="text-xs">{a.type}</TableCell>
                  <TableCell className="text-xs">{String(a.maxMarks)}</TableCell>
                  <TableCell><Badge variant={a.isPublished ? 'default' : 'outline'}>{a.isPublished ? 'Published' : 'Draft'}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/exams/${a.id}`} />}>View</Button></TableCell>
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <PaginationItem key={p}><PaginationLink href={href(p)} isActive={p === page}>{p}</PaginationLink></PaginationItem>)}
            {page < totalPages && <PaginationItem><PaginationNext href={href(page + 1)} /></PaginationItem>}
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
