import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getFeeStructure } from '@/lib/fees'
import { updateFeeStructure } from '@/lib/fees/actions'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FeeStructureForm } from '@/components/fees/fee-structure-form'

export const metadata: Metadata = { title: 'Edit Fee Structure' }

export default async function EditFeeStructurePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params
  const structure = await getFeeStructure(id)
  if (!structure) notFound()

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Edit Fee Structure"
        subtitle={structure.name}
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
          <FeeStructureForm
            action={updateFeeStructure.bind(null, id)}
            submitLabel="Save changes"
            initialData={{
              name: structure.name,
              description: structure.description ?? '',
              amount: Number(structure.amount),
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
