import Link from 'next/link'
import type { Metadata } from 'next'
import { Search, Plus, CreditCard } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { listInvoices } from '@/lib/fees'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { invoiceStatusVariant } from '@/lib/status-variants'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { selectClass } from '@/components/form-helpers'
import { formatCurrency } from '@/lib/format'

export const metadata: Metadata = { title: 'Fees' }

const PAGE_SIZE = 20

export default async function FeesPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  const page = Math.max(1, Number(params.page) || 1)
  const status = typeof params.status === 'string' ? params.status : ''
  const { invoices, total } = await listInvoices({ q, page, pageSize: PAGE_SIZE, status: status || undefined })
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function href(p: number) {
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (status) sp.set('status', status)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/admin/fees${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Fee Management"
        subtitle={`${total} invoice${total === 1 ? '' : 's'}`}
        action={<Button render={<Link href="/admin/fees/new" />}><Plus /> New invoice</Button>}
      />
      <div className="flex flex-wrap items-end gap-3">
        <form action="/admin/fees" method="GET" className="flex items-end gap-3">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Search invoice#, student…" className="pl-9" aria-label="Search fees" />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        <form action="/admin/fees" method="GET" className="flex items-end gap-3">
          {q && <input type="hidden" name="q" value={q} />}
          <div>
            <Label htmlFor="fee-status">Status</Label>
            <select id="fee-status" name="status" className={selectClass} defaultValue={status}>
              <option value="">All statuses</option>
              {['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Button type="submit" variant="outline">Filter</Button>
        </form>
      </div>
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-lg">Invoices</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                <EmptyState
                  icon={CreditCard}
                  title="No invoices found"
                  description="There are no invoices matching your criteria."
                />
              </TableCell></TableRow>}
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <TableCell className="font-mono text-xs">{inv.invoiceNo}</TableCell>
                  <TableCell className="font-medium">{inv.student.firstName} {inv.student.lastName}</TableCell>
                  <TableCell className="text-xs">{inv.term.name}</TableCell>
                  <TableCell className="text-sm">{formatCurrency(Number(inv.totalAmount))}</TableCell>
                  <TableCell><Badge variant={invoiceStatusVariant[inv.status] ?? 'outline'}>{inv.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/fees/${inv.id}`} />}>View</Button></TableCell>
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
