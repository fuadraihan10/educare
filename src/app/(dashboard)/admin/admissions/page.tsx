import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, Plus, UserPlus } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listAdmissions } from '@/lib/admissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { admissionStatusVariant } from '@/lib/status-variants'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { selectClass } from '@/components/form-helpers'

export const metadata: Metadata = { title: 'Admissions' }

const PAGE_SIZE = 20

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>
}) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const page = Math.max(1, Number(params.page) || 1)
  const status = typeof params.status === 'string' ? params.status : ''

  const { admissions, total } = await listAdmissions({ q, page, pageSize: PAGE_SIZE, status: status || undefined })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function href(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (status) sp.set('status', status)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/admin/admissions${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Admissions"
        subtitle={`${total} application${total === 1 ? '' : 's'}`}
        action={<Button render={<Link href="/admin/admissions/new" />}><Plus /> New application</Button>}
      />

      <div className="flex flex-wrap items-end gap-3">
        <form action="/admin/admissions" method="GET" className="flex items-end gap-3">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search by name, phone or guardian…" className="pl-9" aria-label="Search admissions" />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <form action="/admin/admissions" method="GET" className="flex items-end gap-3">
          {q && <input type="hidden" name="q" value={q} />}
          <div>
            <Label htmlFor="adm-status">Status</Label>
            <select id="adm-status" name="status" className={selectClass} defaultValue={status}>
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
      </div>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-lg">Applications</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.length === 0 && (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  <EmptyState
                    icon={UserPlus}
                    title="No applications found"
                    description="There are no admission applications matching your criteria."
                  />
                </TableCell></TableRow>
              )}
              {admissions.map((a) => (
                <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{a.applicantName}</TableCell>
                  <TableCell className="text-sm">{a.guardianName}</TableCell>
                  <TableCell><span className="text-sm">{a.appliedClass.name}</span> <Badge variant="secondary" className="text-xs">{a.appliedClass.section}</Badge></TableCell>
                  <TableCell className="text-xs">{a.academicYear.name}</TableCell>
                  <TableCell><Badge variant={admissionStatusVariant[a.status] ?? 'outline'}>{a.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/admissions/${a.id}`} />}>View</Button>
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
