import { describe, expect, it } from 'vitest'
import {
  attendanceStatusVariant,
  admissionStatusVariant,
  feeStatusVariant,
  invoiceStatusVariant,
  userStatusVariant,
  staffStatusVariant,
} from '@/lib/status-variants'

const VALID_VARIANTS = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'] as const

const variantMaps = [
  { name: 'attendanceStatusVariant', map: attendanceStatusVariant, keys: ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'] },
  { name: 'admissionStatusVariant', map: admissionStatusVariant, keys: ['PENDING', 'APPROVED', 'REJECTED'] },
  { name: 'feeStatusVariant', map: feeStatusVariant, keys: ['PAID', 'ISSUED', 'PARTIAL', 'OVERDUE', 'CANCELLED'] },
  { name: 'invoiceStatusVariant', map: invoiceStatusVariant, keys: ['PAID', 'ISSUED', 'PARTIAL', 'OVERDUE', 'CANCELLED', 'DRAFT'] },
  { name: 'userStatusVariant', map: userStatusVariant, keys: ['ACTIVE', 'INACTIVE', 'GRADUATED', 'WITHDRAWN'] },
  { name: 'staffStatusVariant', map: staffStatusVariant, keys: ['ACTIVE', 'INACTIVE'] },
]

for (const { name, map, keys } of variantMaps) {
  describe(name, () => {
    it('has all expected keys', () => {
      for (const key of keys) {
        expect(map).toHaveProperty(key)
      }
    })

    it('all values are valid BadgeProps variants', () => {
      for (const [, variant] of Object.entries(map)) {
        expect(VALID_VARIANTS).toContain(variant)
      }
    })
  })
}
