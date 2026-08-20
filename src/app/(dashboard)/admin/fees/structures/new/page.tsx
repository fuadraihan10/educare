import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, Plus } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { createFeeStructure } from '@/lib/fees/actions'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FeeStructureForm } from '@/components/fees/fee-structure-form'

export const metadata: Metadata = { title: 'New Fee Structure' }

export default async function NewFeeStructurePage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="New Fee Structure"
        subtitle="Define a fee type that can be applied to invoices."
        breadcrumb={
          <Link href="/admin/fees/structures" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Fee Structures
          </Link>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
          <CardTitle className="text-base font-semibold">Fee Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <FeeStructureForm action={createFeeStructure} submitLabel="Create fee structure" />
        </CardContent>
      </Card>
    </div>
  )
}
