import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, Plus, Trash2, ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listAssignments } from '@/lib/subjects'
import { listAcademicYears } from '@/lib/classes'
import { deleteAssignment } from '@/lib/subjects/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { selectClass } from '@/components/form-helpers'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = { title: 'Teaching Assignments' }

const PAGE_SIZE = 20

export default async function AssignmentsPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; year?: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const page = Math.max(1, Number(params.page) || 1)
  const year = typeof params.year === 'string' ? params.year : ''

  const [years, { assignments, total }] = await Promise.all([
    listAcademicYears(),
    listAssignments({ q, page, pageSize: PAGE_SIZE, academicYearId: year || undefined }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function href(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (year) sp.set('year', year)
    if (p > 1) sp.set('page', String(p))
    return `/admin/subjects/assignments${sp.toString() ? `?${sp.toString()}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Teaching Assignments"
        subtitle={`${total} assignment${total === 1 ? '' : 's'} found`}
        breadcrumb={
          <Link href="/admin/subjects" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Subjects
          </Link>
        }
      >
        <Button variant="outline" render={<Link href="/admin/subjects" />}>Subjects</Button>
        <Button render={<Link href="/admin/subjects/assignments/new" />}><Plus /> Add Assignment</Button>
      </PageHeader>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3">
            <form action="/admin/subjects/assignments" method="GET" className="flex gap-2 flex-1 max-w-md">
              {year && <input type="hidden" name="year" value={year} />}
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input name="q" defaultValue={q} placeholder="Search class, subject or teacher..." className="pl-9 bg-muted/30 border-border/50" aria-label="Search assignments" />
              </div>
              <Button type="submit" variant="outline">Search</Button>
            </form>
            <form action="/admin/subjects/assignments" method="GET" className="flex gap-2">
              {q && <input type="hidden" name="q" value={q} />}
              <select name="year" className={selectClass} defaultValue={year}>
                <option value="">All years</option>
                {years.map((y) => (<option key={y.id} value={y.id}>{y.name}{y.isActive ? ' (active)' : ''}</option>))}
              </select>
              <Button type="submit" variant="outline">Filter</Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Assignment List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No assignments found.</TableCell></TableRow>
                )}
                {assignments.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <TableCell><span className="text-sm">{a.class.name}</span> <Badge variant="secondary" className="text-xs">{a.class.section}</Badge></TableCell>
                    <TableCell className="font-medium">{a.subject.name}</TableCell>
                    <TableCell className="text-sm">{a.teacher.name} <span className="text-xs text-muted-foreground">({a.teacher.employeeId})</span></TableCell>
                    <TableCell className="text-xs">{a.academicYear.name}</TableCell>
                    <TableCell className="text-right">
                      <form action={deleteAssignment.bind(null, a.id)} className="inline-block">
                        <Button variant="ghost" size="icon" type="submit" aria-label="Remove assignment"><Trash2 className="text-destructive size-4" /></Button>
                      </form>
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
