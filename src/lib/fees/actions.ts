'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { prisma } from '@/lib/db'
import { requireRole } from '@/lib/permissions'
import { auditLog } from '@/lib/audit'
import { seqOf } from '@/lib/fees/helpers'
import { Prisma } from '@/generated/prisma/client'
import { deliverNotification, deliverNotificationToRole } from '@/lib/notifications'

export type InvoiceFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const invoiceSchema = z.object({
  studentId: z.string().min(1, 'Student is required.'),
  termId: z.string().min(1, 'Term is required.'),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.'),
  notes: z.string().trim().optional(),
  feeStructureIds: z.string().optional(),
})

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString()
    if (key && !out[key]) out[key] = issue.message
  }
  return out
}


export async function createInvoice(_prev: InvoiceFormState, formData: FormData): Promise<InvoiceFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = invoiceSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  let feeIds: string[] = []
  try { feeIds = v.feeStructureIds ? JSON.parse(v.feeStructureIds) : [] } catch { return { status: 'error', message: 'Invalid fee data.' } }
  if (!Array.isArray(feeIds) || !feeIds.every(id => typeof id === 'string')) {
    return { status: 'error', message: 'Invalid fee structure IDs.' }
  }

  const fees = feeIds.length > 0
    ? await prisma.feeStructure.findMany({ where: { id: { in: feeIds } } })
    : await prisma.feeStructure.findMany({ where: { isActive: true } })

  const total = fees.reduce((sum, f) => sum + Number(f.amount), 0)
  if (total === 0) return { status: 'error', message: 'No fee structures selected or all amounts are zero.' }

  const year = new Date().getFullYear()
  let invoiceNo = ''
  let seq = 1001
  let retries = 0
  const maxRetries = 5

  while (retries < maxRetries) {
    const last = await prisma.invoice.findFirst({
      where: { invoiceNo: { startsWith: `INV-${year}-` } },
      orderBy: { invoiceNo: 'desc' },
      select: { invoiceNo: true },
    })
    seq = last ? seqOf(last.invoiceNo) + 1 : 1001
    invoiceNo = `INV-${year}-${seq}`

    try {
      const created = await prisma.invoice.create({
        data: {
          invoiceNo,
          studentId: v.studentId,
          termId: v.termId,
          issueDate: new Date(`${v.issueDate}T00:00:00.000Z`),
          dueDate: new Date(`${v.dueDate}T00:00:00.000Z`),
          totalAmount: total,
          notes: v.notes || null,
          status: 'ISSUED',
          createdById: actor.id,
          items: { create: fees.map((f) => ({ feeStructureId: f.id, description: f.name, amount: f.amount })) },
        },
        select: { id: true },
      })
      await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'Invoice', entityId: created.id, details: { invoiceNo, studentId: v.studentId } })

      const studentUser = await prisma.student.findUnique({ where: { id: v.studentId }, select: { userId: true } })
      if (studentUser?.userId) {
        await deliverNotification({
          userId: studentUser.userId,
          title: 'New Invoice',
          body: `Invoice ${invoiceNo} has been created for ৳${total.toLocaleString()}. Due by ${v.dueDate}.`,
          type: 'info',
          category: 'fees',
          entity: 'Invoice',
          entityId: created.id,
          link: '/student/fees',
        })
      }

      revalidatePath('/admin/fees')
      redirect(`/admin/fees/${created.id}`)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002' && retries < maxRetries) {
        retries++
        continue
      }
      if (e instanceof Error && e.message === 'NEXT_REDIRECT') throw e
      return { status: 'error', message: 'Something went wrong. Please try again.' }
    }
  }

  return { status: 'error', message: 'Unable to generate unique invoice number.' }
}

export type PaymentFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export async function submitPayment(invoiceId: string, _prev: PaymentFormState, formData: FormData): Promise<PaymentFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN', 'STUDENT', 'PARENT')
  const amount = Number(formData.get('amount'))
  const method = formData.get('method') as string
  const reference = (formData.get('reference') as string)?.trim() || null

  if (!amount || amount <= 0) return { status: 'error', message: 'Invalid payment amount.' }
  if (!method) return { status: 'error', message: 'Payment method is required.' }

  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { id: true, invoiceNo: true, status: true, totalAmount: true, studentId: true } })
  if (!invoice) return { status: 'error', message: 'Invoice not found.' }
  if (invoice.status === 'DRAFT') return { status: 'error', message: 'Cannot submit payment for a draft invoice.' }
  if (invoice.status === 'PAID') return { status: 'error', message: 'Invoice is already fully paid.' }
  if (invoice.status === 'CANCELLED') return { status: 'error', message: 'Invoice has been cancelled.' }

  if (actor.role === 'STUDENT') {
    const student = await prisma.student.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!student || student.id !== invoice.studentId) {
      return { status: 'error', message: 'You can only pay your own invoices.' }
    }
  }
  if (actor.role === 'PARENT') {
    const link = await prisma.studentGuardian.findFirst({ where: { parentUserId: actor.id, studentId: invoice.studentId }, select: { id: true } })
    if (!link) {
      return { status: 'error', message: 'You can only pay invoices for your children.' }
    }
  }

  if (reference) {
    const existing = await prisma.payment.findFirst({
      where: { invoiceId, reference, status: { not: 'REJECTED' } },
      select: { id: true },
    })
    if (existing) return { status: 'error', message: 'A payment with this reference has already been submitted.' }
  }

  await prisma.payment.create({
    data: {
      invoiceId,
      amount,
      method: method as 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'UPI' | 'OTHER',
      reference,
      submittedById: actor.id,
      status: 'PENDING',
    },
  })

  await auditLog({ actorId: actor.id, action: 'SUBMIT_PAYMENT', entity: 'Payment', entityId: invoiceId, details: { amount, method } })

  const invoiceStudent = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { student: { select: { userId: true } } } })
  await deliverNotificationToRole('ADMIN', {
    title: 'Payment Submitted',
    body: `A payment of ৳${amount.toLocaleString()} has been submitted for invoice ${invoice.invoiceNo} via ${method}.`,
    type: 'info',
    category: 'fees',
    entity: 'Payment',
    entityId: invoiceId,
    link: `/admin/fees/${invoiceId}`,
  })
  if (invoiceStudent?.student?.userId && actor.role !== 'ADMIN') {
    await deliverNotification({
      userId: invoiceStudent.student.userId,
      title: 'Payment Submitted',
      body: `Your payment of ৳${amount.toLocaleString()} has been submitted and is pending confirmation.`,
      type: 'success',
      category: 'fees',
      entity: 'Payment',
      entityId: invoiceId,
      link: '/student/fees',
    })
  }

  revalidatePath('/admin/fees')
  revalidatePath(`/admin/fees/${invoiceId}`)
  revalidatePath('/parent/fees')
  revalidatePath('/student/fees')
  return { status: 'success', message: 'Payment submitted for confirmation.' }
}

export async function confirmPayment(paymentId: string, _prev: PaymentFormState, _formData: FormData): Promise<PaymentFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, select: { id: true, invoiceId: true, status: true, amount: true } })
  if (!payment) return { status: 'error', message: 'Payment not found.' }
  if (payment.status !== 'PENDING') return { status: 'error', message: 'Payment is not pending.' }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: paymentId }, data: { status: 'CONFIRMED', confirmedById: actor.id, confirmedAt: new Date() } })

    const confirmed = await tx.payment.aggregate({ where: { invoiceId: payment.invoiceId, status: 'CONFIRMED', id: { not: paymentId } }, _sum: { amount: true } })
    const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId }, select: { totalAmount: true, status: true } })

    if (!invoice) return

    const totalConfirmed = Number(confirmed._sum.amount ?? 0) + Number(payment.amount)
    const totalAmount = Number(invoice.totalAmount)

    if (invoice.status === 'PAID') return

    if (totalConfirmed >= totalAmount) {
      await tx.invoice.update({ where: { id: payment.invoiceId }, data: { status: 'PAID' } })
    } else if (totalConfirmed > 0 && invoice.status !== 'PARTIAL') {
      await tx.invoice.update({ where: { id: payment.invoiceId }, data: { status: 'PARTIAL' } })
    }
  })

  await auditLog({ actorId: actor.id, action: 'CONFIRM_PAYMENT', entity: 'Payment', entityId: paymentId })

  const confirmedInvoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId }, select: { invoiceNo: true, student: { select: { userId: true } } } })
  if (confirmedInvoice?.student?.userId) {
    await deliverNotification({
      userId: confirmedInvoice.student.userId,
      title: 'Payment Confirmed',
      body: `Your payment for invoice ${confirmedInvoice.invoiceNo ?? payment.invoiceId.slice(0, 8) + '...'} has been confirmed.`,
      type: 'success',
      category: 'fees',
      entity: 'Invoice',
      entityId: payment.invoiceId,
      link: '/student/fees',
    })
  }

  revalidatePath('/admin/fees')
  revalidatePath(`/admin/fees/${payment.invoiceId}`)
  revalidatePath('/parent/fees')
  revalidatePath('/student/fees')
  return { status: 'success', message: 'Payment confirmed.' }
}

export async function rejectPayment(paymentId: string, _prev: PaymentFormState, _formData: FormData): Promise<PaymentFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, select: { id: true, invoiceId: true, status: true } })
  if (!payment) return { status: 'error', message: 'Payment not found.' }
  if (payment.status !== 'PENDING') return { status: 'error', message: 'Payment is not pending.' }

  await prisma.payment.update({ where: { id: paymentId }, data: { status: 'REJECTED' } })
  await auditLog({ actorId: actor.id, action: 'REJECT_PAYMENT', entity: 'Payment', entityId: paymentId })

  const rejectedInvoice = await prisma.invoice.findUnique({ where: { id: payment.invoiceId }, select: { invoiceNo: true, student: { select: { userId: true } } } })
  if (rejectedInvoice?.student?.userId) {
    await deliverNotification({
      userId: rejectedInvoice.student.userId,
      title: 'Payment Rejected',
      body: `Your payment for invoice ${rejectedInvoice.invoiceNo ?? payment.invoiceId.slice(0, 8) + '...'} has been rejected. Please contact the office for details.`,
      type: 'error',
      category: 'fees',
      entity: 'Payment',
      entityId: payment.invoiceId,
      link: '/student/fees',
    })
  }

  revalidatePath('/admin/fees')
  revalidatePath(`/admin/fees/${payment.invoiceId}`)
  revalidatePath('/parent/fees')
  revalidatePath('/student/fees')
  return { status: 'success', message: 'Payment rejected.' }
}

export type FeeStructureFormState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
}

const feeStructureSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  description: z.string().trim().optional(),
  amount: z.string().min(1, 'Amount is required.').refine((v) => Number(v) >= 0, 'Must be non-negative'),
})

export async function createFeeStructure(_prev: FeeStructureFormState, formData: FormData): Promise<FeeStructureFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const parsed = feeStructureSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  await prisma.feeStructure.create({
    data: { name: v.name, description: v.description || null, amount: Number(v.amount) },
  })
  await auditLog({ actorId: actor.id, action: 'CREATE', entity: 'FeeStructure', details: { name: v.name } })
  revalidatePath('/admin/fees')
  return { status: 'success', message: 'Fee structure created.' }
}

export async function updateFeeStructure(id: string, _prev: FeeStructureFormState, formData: FormData): Promise<FeeStructureFormState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const existing = await prisma.feeStructure.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return { status: 'error', message: 'Fee structure not found.' }

  const parsed = feeStructureSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { status: 'error', message: 'Please fix the highlighted fields.', errors: fieldErrors(parsed.error) }
  const v = parsed.data

  await prisma.feeStructure.update({
    where: { id },
    data: { name: v.name, description: v.description || null, amount: Number(v.amount) },
  })
  await auditLog({ actorId: actor.id, action: 'UPDATE', entity: 'FeeStructure', entityId: id, details: { name: v.name } })
  revalidatePath('/admin/fees')
  revalidatePath('/admin/fees/structures')
  revalidatePath('/admin/fees/structures/' + id)
  return { status: 'success', message: 'Fee structure updated.' }
}

export async function deleteFeeStructure(id: string): Promise<void> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const existing = await prisma.feeStructure.findUnique({ where: { id }, select: { id: true, name: true, _count: { select: { items: true } } } })
  if (!existing) return

  if (existing._count.items > 0) {
    await prisma.feeStructure.update({ where: { id }, data: { isActive: false } })
    await auditLog({ actorId: actor.id, action: 'DEACTIVATE', entity: 'FeeStructure', entityId: id, details: { name: existing.name, reason: 'Has linked invoices' } })
  } else {
    await prisma.feeStructure.delete({ where: { id } })
    await auditLog({ actorId: actor.id, action: 'DELETE', entity: 'FeeStructure', entityId: id, details: { name: existing.name } })
  }
  revalidatePath('/admin/fees')
  revalidatePath('/admin/fees/structures')
}

export type InvoiceActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

export async function cancelInvoice(id: string, _prev: InvoiceActionState, _formData: FormData): Promise<InvoiceActionState> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { id: true, status: true, invoiceNo: true, studentId: true } })
  if (!invoice) return { status: 'error', message: 'Invoice not found.' }
  if (invoice.status === 'CANCELLED') return { status: 'error', message: 'Invoice is already cancelled.' }
  if (invoice.status === 'PAID') return { status: 'error', message: 'Cannot cancel a fully paid invoice.' }

  const hasConfirmed = await prisma.payment.findFirst({ where: { invoiceId: id, status: 'CONFIRMED' }, select: { id: true } })
  if (hasConfirmed) return { status: 'error', message: 'Cannot cancel invoice with confirmed payments. Refund them first.' }

  await prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } })
  await auditLog({ actorId: actor.id, action: 'CANCEL', entity: 'Invoice', entityId: id, details: { invoiceNo: invoice.invoiceNo } })

  const student = await prisma.student.findUnique({ where: { id: invoice.studentId }, select: { userId: true } })
  if (student?.userId) {
    await deliverNotification({
      userId: student.userId,
      title: 'Invoice Cancelled',
      body: `Invoice ${invoice.invoiceNo} has been cancelled by the administration.`,
      type: 'warning',
      category: 'fees',
      entity: 'Invoice',
      entityId: id,
      link: '/student/fees',
    })
  }

  revalidatePath('/admin/fees')
  revalidatePath(`/admin/fees/${id}`)
  revalidatePath('/student/fees')
  return { status: 'success', message: 'Invoice cancelled.' }
}

export async function deleteInvoice(id: string): Promise<{ success: boolean; message: string }> {
  const actor = await requireRole('SUPER_ADMIN', 'ADMIN')
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: { id: true, invoiceNo: true, status: true } })
  if (!invoice) return { success: false, message: 'Invoice not found.' }

  const hasPayments = await prisma.payment.findFirst({ where: { invoiceId: id, status: { in: ['PENDING', 'CONFIRMED'] } }, select: { id: true } })
  if (hasPayments) return { success: false, message: 'Cannot delete invoice with pending or confirmed payments.' }

  await prisma.$transaction(async (tx) => {
    await tx.payment.deleteMany({ where: { invoiceId: id } })
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } })
    await tx.invoice.delete({ where: { id } })
  })

  await auditLog({ actorId: actor.id, action: 'DELETE', entity: 'Invoice', entityId: id, details: { invoiceNo: invoice.invoiceNo } })
  revalidatePath('/admin/fees')
  return { success: true, message: 'Invoice deleted.' }
}

export async function deleteInvoiceAction(_prev: InvoiceFormState, formData: FormData): Promise<InvoiceFormState> {
  const id = String(formData.get('invoiceId') ?? '')
  if (!id) return { status: 'error', message: 'Missing invoice ID.' }
  const result = await deleteInvoice(id)
  if (!result.success) return { status: 'error', message: result.message }
  return { status: 'success', message: result.message }
}

export async function markOverdueInvoices(): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const result = await prisma.invoice.updateMany({
    where: {
      status: { in: ['ISSUED', 'PARTIAL'] },
      dueDate: { lt: today },
    },
    data: { status: 'OVERDUE' },
  })

  if (result.count > 0) {
    await auditLog({ action: 'OVERDUE_UPDATE', entity: 'Invoice', details: { count: result.count } })
  }

  return result.count
}
