import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { listTerms } from '@/lib/exams'
import { createInvoice } from '@/lib/fees/actions'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InvoiceCreateForm } from '@/components/fees/invoice-create-form'

export const metadata: Metadata = { title: 'New Invoice' }

export default async function NewInvoicePage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const [terms, students, feeStructures] = await Promise.all([
    listTerms(),
    prisma.student.findMany({ where: { status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, admissionNo: true }, orderBy: { admissionNo: 'asc' } }),
    prisma.feeStructure.findMany({ where: { isActive: true }, select: { id: true, name: true, amount: true }, orderBy: { name: 'asc' } }),
  ])

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="New Invoice"
        subtitle="Generate a fee invoice for a student."
        breadcrumb={
          <Link href="/admin/fees" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Fees
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <InvoiceCreateForm action={createInvoice} submitLabel="Create Invoice" students={students} terms={terms} feeStructures={feeStructures} />
        </CardContent>
      </Card>
    </div>
  )
}
