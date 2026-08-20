import type { Metadata } from 'next'
import { requirePage } from '@/lib/permissions'
import { prisma } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { feeStatusVariant, feeStatusLabel } from '@/lib/status-variants'
import dayjs from 'dayjs'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { StatCard } from '@/components/stat-card'
import { formatCurrency } from '@/lib/format'
import { CreditCard, CheckCircle, Clock, AlertCircle, Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Fees' }

export default async function ParentFeesPage() {
  const user = await requirePage('PARENT')
  const links = await prisma.studentGuardian.findMany({
    where: { parentUserId: user.id },
    select: { student: { select: { id: true, firstName: true, lastName: true } } },
  })
  if (links.length === 0) return <EmptyState icon={AlertCircle} title="No linked students found" description="No students are linked to your parent account." />

  const studentIds = links.map((l) => l.student.id)
  const invoices = await prisma.invoice.findMany({
    where: { studentId: { in: studentIds } },
    include: { term: { select: { name: true } }, payments: { select: { amount: true, status: true } }, student: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const totalAmount = invoices.reduce((s, i) => s + Number(i.totalAmount), 0)
  const totalPaid = invoices.reduce((s, i) => s + i.payments.filter((p) => p.status === 'CONFIRMED').reduce((ps, p) => ps + Number(p.amount), 0), 0)
  const totalRemaining = totalAmount - totalPaid
  const paidCount = invoices.filter((i) => i.status === 'PAID').length
  const pendingCount = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED').length

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title="Fees" subtitle="Invoices and payment status for your children." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Children" value={links.length} icon={Users} iconColor="bg-blue-500/10" subtitle="Linked students" />
        <StatCard title="Total Invoiced" value={formatCurrency(totalAmount)} icon={CreditCard} iconColor="bg-violet-500/10" subtitle={`${invoices.length} invoice(s)`} />
        <StatCard title="Total Paid" value={formatCurrency(totalPaid)} icon={CheckCircle} iconColor="bg-emerald-500/10" subtitle={`${paidCount} paid`} />
        <StatCard title="Remaining" value={formatCurrency(totalRemaining)} icon={Clock} iconColor="bg-amber-500/10" subtitle={`${pendingCount} pending`} />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight">Invoices</h2>
          <p className="text-sm text-muted-foreground mt-0.5">All invoices for your children</p>
        </div>
        <div className="glass-table overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Student</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Invoice #</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Term</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Paid</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground" scope="col">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center">
                  <EmptyState icon={CreditCard} title="No invoices" description="There are no invoices for your children yet." />
                </td></tr>
              )}
              {invoices.map((inv) => {
                const paid = inv.payments.filter((p) => p.status === 'CONFIRMED').reduce((s, p) => s + Number(p.amount), 0)
                return (
                  <tr key={inv.id} className="border-b border-border/30 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-3.5 font-medium">{inv.student.firstName} {inv.student.lastName}</td>
                    <td className="px-6 py-3.5 font-mono text-xs font-medium">{inv.invoiceNo}</td>
                    <td className="px-6 py-3.5">{inv.term.name}</td>
                    <td className="px-6 py-3.5 font-medium">{formatCurrency(Number(inv.totalAmount))}</td>
                    <td className="px-6 py-3.5 text-muted-foreground">{formatCurrency(paid)}</td>
                    <td className="px-6 py-3.5">
                      <Badge variant={feeStatusVariant[inv.status] ?? 'outline'} className="font-medium">{feeStatusLabel[inv.status] ?? inv.status}</Badge>
                    </td>
                    <td className="px-6 py-3.5 text-xs text-muted-foreground">{dayjs(inv.dueDate).format('DD MMM YYYY')}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
