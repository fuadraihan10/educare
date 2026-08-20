import { badgeVariants } from '@/components/ui/badge'
import type { VariantProps } from 'class-variance-authority'

type Variant = NonNullable<VariantProps<typeof badgeVariants>['variant']>

export const attendanceStatusVariant: Record<string, Variant> = {
  PRESENT: 'default',
  ABSENT: 'destructive',
  LATE: 'secondary',
  LEAVE: 'outline',
}

export const admissionStatusVariant: Record<string, Variant> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
}

export const feeStatusVariant: Record<string, Variant> = {
  PAID: 'default',
  ISSUED: 'secondary',
  PARTIAL: 'outline',
  OVERDUE: 'destructive',
  CANCELLED: 'outline',
}

export const invoiceStatusVariant: Record<string, Variant> = {
  PAID: 'default',
  ISSUED: 'secondary',
  PARTIAL: 'outline',
  OVERDUE: 'destructive',
  CANCELLED: 'outline',
  DRAFT: 'outline',
}

export const feeStatusLabel: Record<string, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Pending',
  PARTIAL: 'Partial',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
}

export const paymentStatusVariant: Record<string, Variant> = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  REJECTED: 'destructive',
  REFUNDED: 'outline',
}

export const paymentStatusLabel: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  REJECTED: 'Rejected',
  REFUNDED: 'Refunded',
}

export const userStatusVariant: Record<string, Variant> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
  GRADUATED: 'outline',
  WITHDRAWN: 'destructive',
}

export const staffStatusVariant: Record<string, Variant> = {
  ACTIVE: 'default',
  INACTIVE: 'secondary',
}
