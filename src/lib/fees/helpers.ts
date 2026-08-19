export function seqOf(invoiceNo: string): number {
  const i = Number(invoiceNo.slice(invoiceNo.lastIndexOf('-') + 1))
  return Number.isInteger(i) ? i : 0
}

export function generateInvoiceNo(year: number, seq: number): string {
  return `INV-${year}-${seq}`
}

export function determineInvoiceStatus(totalConfirmed: number, totalAmount: number, currentStatus: string): string {
  if (currentStatus === 'PAID' || currentStatus === 'CANCELLED') return currentStatus
  if (totalConfirmed >= totalAmount) return 'PAID'
  if (totalConfirmed > 0) return 'PARTIAL'
  return currentStatus
}
