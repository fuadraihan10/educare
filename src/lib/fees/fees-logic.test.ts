import { describe, expect, it } from 'vitest'
import { seqOf, generateInvoiceNo, determineInvoiceStatus } from '@/lib/fees/helpers'

describe('fees/helpers', () => {
  describe('seqOf', () => {
    it('extracts sequence from standard invoice number', () => {
      expect(seqOf('INV-2026-1001')).toBe(1001)
    })

    it('extracts small sequence numbers', () => {
      expect(seqOf('INV-2026-99')).toBe(99)
    })

    it('returns 0 for invalid invoice number', () => {
      expect(seqOf('invalid')).toBe(0)
    })

    it('extracts sequence from single-digit number', () => {
      expect(seqOf('INV-2026-5')).toBe(5)
    })
  })

  describe('generateInvoiceNo', () => {
    it('generates correct invoice number format', () => {
      expect(generateInvoiceNo(2026, 1001)).toBe('INV-2026-1001')
    })

    it('generates with different seq', () => {
      expect(generateInvoiceNo(2025, 42)).toBe('INV-2025-42')
    })
  })

  describe('determineInvoiceStatus', () => {
    it('returns PARTIAL when confirmed < total', () => {
      expect(determineInvoiceStatus(50, 100, 'ISSUED')).toBe('PARTIAL')
    })

    it('returns PAID when confirmed >= total', () => {
      expect(determineInvoiceStatus(100, 100, 'ISSUED')).toBe('PAID')
      expect(determineInvoiceStatus(150, 100, 'ISSUED')).toBe('PAID')
    })

    it('returns PAID when confirmed >= total from PARTIAL', () => {
      expect(determineInvoiceStatus(200, 100, 'PARTIAL')).toBe('PAID')
    })

    it('returns ISSUED when no payments confirmed', () => {
      expect(determineInvoiceStatus(0, 100, 'ISSUED')).toBe('ISSUED')
    })

    it('returns PARTIAL when confirmed > 0 and current is ISSUED', () => {
      expect(determineInvoiceStatus(1, 100, 'ISSUED')).toBe('PARTIAL')
    })

    it('preserves PAID status', () => {
      expect(determineInvoiceStatus(0, 100, 'PAID')).toBe('PAID')
    })

    it('preserves CANCELLED status', () => {
      expect(determineInvoiceStatus(100, 100, 'CANCELLED')).toBe('CANCELLED')
      expect(determineInvoiceStatus(0, 100, 'CANCELLED')).toBe('CANCELLED')
    })

    it('returns current status when confirmed is 0', () => {
      expect(determineInvoiceStatus(0, 50, 'OVERDUE')).toBe('OVERDUE')
    })
  })
})
