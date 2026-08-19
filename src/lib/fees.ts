import 'server-only'

import { prisma } from '@/lib/db'

export type InvoiceListItem = {
  id: string
  invoiceNo: string
  totalAmount: unknown
  status: string
  issueDate: Date
  dueDate: Date
  student: { id: string; firstName: string; lastName: string; admissionNo: string }
  term: { name: string }
  _count: { payments: number }
}

export async function listInvoices(input: {
  q?: string
  page?: number
  pageSize?: number
  status?: string
}): Promise<{ invoices: InvoiceListItem[]; total: number }> {
  const q = input.q?.trim()
  const page = Math.max(1, input.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20))

  const where: Record<string, unknown> = {}
  if (input.status) where.status = input.status
  if (q) {
    where.OR = [
      { invoiceNo: { contains: q, mode: 'insensitive' } },
      { student: { firstName: { contains: q, mode: 'insensitive' } } },
      { student: { lastName: { contains: q, mode: 'insensitive' } } },
      { student: { admissionNo: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const [invoices, total] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      select: {
        id: true, invoiceNo: true, totalAmount: true, status: true, issueDate: true, dueDate: true,
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        term: { select: { name: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.invoice.count({ where }),
  ])

  return { invoices, total }
}

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      term: { select: { id: true, name: true } },
      items: true,
      payments: {
        include: { submittedBy: { select: { name: true } }, confirmedBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
}

export async function listFeeStructures() {
  return prisma.feeStructure.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
}

export async function getStudentInvoices(studentId: string) {
  return prisma.invoice.findMany({
    where: { studentId },
    include: { term: { select: { name: true } }, payments: true },
    orderBy: { createdAt: 'desc' },
  })
}
