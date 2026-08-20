import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Plus, Layers } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getAllFeeStructures } from '@/lib/fees'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { formatCurrency } from '@/lib/format'
import { DeleteFeeStructureButton } from '@/components/fees/fee-structure-actions'

export const metadata: Metadata = { title: 'Fee Structures' }

export default async function FeeStructuresPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const structures = await getAllFeeStructures()

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Fee Structures"
        subtitle={`${structures.length} structure${structures.length === 1 ? '' : 's'}`}
        breadcrumb={
          <Link href="/admin/fees" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Fees
          </Link>
        }
        action={
          <Button render={<Link href="/admin/fees/structures/new" />}>
            <Plus /> Add fee structure
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">All Fee Structures</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Linked Invoices</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structures.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      <EmptyState
                        icon={Layers}
                        title="No fee structures"
                        description="Create your first fee structure to get started."
                      />
                    </TableCell>
                  </TableRow>
                )}
                {structures.map((fs) => (
                  <TableRow key={fs.id}>
                    <TableCell className="font-medium">{fs.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{fs.description || '—'}</TableCell>
                    <TableCell className="font-mono text-sm">{formatCurrency(Number(fs.amount))}</TableCell>
                    <TableCell className="text-sm">{fs._count.items}</TableCell>
                    <TableCell>
                      <Badge variant={fs.isActive ? 'default' : 'secondary'} className="text-xs">
                        {fs.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/admin/fees/structures/${fs.id}`} />}>
                          Edit
                        </Button>
                        <DeleteFeeStructureButton feeStructureId={fs.id} feeStructureName={fs.name} hasLinkedInvoices={fs._count.items > 0} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
