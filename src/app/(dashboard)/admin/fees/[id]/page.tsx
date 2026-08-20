import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'

import { requirePage } from '@/lib/permissions'
import { getInvoice } from '@/lib/fees'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/page-header'
import { Badge } from '@/components/ui/badge'
import { invoiceStatusVariant, feeStatusLabel, paymentStatusLabel } from '@/lib/status-variants'
import { ConfirmPaymentButton, RejectPaymentButton } from '@/components/fees/payment-actions'
import { CancelInvoiceButton, DeleteInvoiceButton } from '@/components/fees/invoice-actions'
import { formatCurrency } from '@/lib/format'

import dayjs from 'dayjs'

export const metadata: Metadata = { title: 'Invoice Details' }

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage('SUPER_ADMIN', 'ADMIN')
  const { id } = await params
  const invoice = await getInvoice(id)
  if (!invoice) notFound()

  const canCancel = invoice.status !== 'CANCELLED' && invoice.status !== 'PAID'
  const canDelete = !invoice.payments.some((p) => p.status === 'PENDING' || p.status === 'CONFIRMED')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={invoice.invoiceNo}
        subtitle={<span className="text-xs">{invoice.student.firstName} {invoice.student.lastName} — {invoice.term.name}</span>}
        breadcrumb={
          <Link href="/admin/fees" className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" /> Fees
          </Link>
        }
      >
        <Badge variant={invoiceStatusVariant[invoice.status] ?? 'outline'} className="text-xs">{feeStatusLabel[invoice.status] ?? invoice.status}</Badge>
        {canCancel && <CancelInvoiceButton invoiceId={id} invoiceNo={invoice.invoiceNo} />}
        {canDelete && <DeleteInvoiceButton invoiceId={id} invoiceNo={invoice.invoiceNo} />}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Amount', value: formatCurrency(Number(invoice.totalAmount)), large: true },
          { label: 'Issue Date', value: dayjs(invoice.issueDate).format('DD MMM YYYY'), large: false },
          { label: 'Due Date', value: dayjs(invoice.dueDate).format('DD MMM YYYY'), large: false },
        ].map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={stat.large ? 'text-2xl font-bold' : 'text-sm font-medium'}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {invoice.notes && (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
          </CardContent>
        </Card>
      )}

      {invoice.items.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-semibold">Line Items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="glass-table rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Description</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.description}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(item.amount))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border/30 font-semibold">
                    <td className="px-4 py-3 text-right text-xs uppercase tracking-wider text-muted-foreground">Total</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(Number(invoice.totalAmount))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {invoice.payments.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/30 bg-muted/20 px-6 py-4">
            <CardTitle className="text-base font-semibold">Payment History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="glass-table rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Method</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Reference</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Submitted by</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Confirmed by</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Date</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground text-xs uppercase tracking-wider" scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p) => (
                    <tr key={p.id} className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium font-mono">{formatCurrency(Number(p.amount))}</td>
                      <td className="px-4 py-3">{p.method}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{p.reference ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={p.status === 'CONFIRMED' ? 'default' : p.status === 'PENDING' ? 'secondary' : 'destructive'} className="text-xs">{paymentStatusLabel[p.status] ?? p.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.submittedBy?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.confirmedBy?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{dayjs(p.createdAt).format('DD MMM YYYY HH:mm')}</td>
                      <td className="px-4 py-3 text-right">
                        {p.status === 'PENDING' && (
                          <div className="flex justify-end gap-2">
                            <ConfirmPaymentButton paymentId={p.id} />
                            <RejectPaymentButton paymentId={p.id} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
