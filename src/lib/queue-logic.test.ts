import { describe, expect, it } from 'vitest'

function backoffMs(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000)
}

describe('queue-logic', () => {
  describe('backoffMs', () => {
    it('returns 1000 for attempt 0', () => {
      expect(backoffMs(0)).toBe(1000)
    })

    it('returns 2000 for attempt 1', () => {
      expect(backoffMs(1)).toBe(2000)
    })

    it('returns 4000 for attempt 2', () => {
      expect(backoffMs(2)).toBe(4000)
    })

    it('caps at 30000 for large attempts', () => {
      expect(backoffMs(10)).toBe(30000)
      expect(backoffMs(20)).toBe(30000)
    })

    it('returns 8000 for attempt 3', () => {
      expect(backoffMs(3)).toBe(8000)
    })

    it('returns 16000 for attempt 4', () => {
      expect(backoffMs(4)).toBe(16000)
    })

    it('returns 30000 for attempt 5 (capped)', () => {
      expect(backoffMs(5)).toBe(30000)
    })
  })
})
