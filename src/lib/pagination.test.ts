import { describe, expect, it } from 'vitest'
import { paginate, getSkipTake, paginationSchema } from '@/lib/pagination'
import type { PaginationParams } from '@/lib/pagination'

const defaultParams: PaginationParams = {
  page: 1,
  pageSize: 20,
  search: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

describe('paginate', () => {
  it('returns empty data for empty array', () => {
    const result = paginate([], defaultParams)
    expect(result.data).toEqual([])
    expect(result.pagination.total).toBe(0)
    expect(result.pagination.totalPages).toBe(0)
    expect(result.pagination.hasNext).toBe(false)
    expect(result.pagination.hasPrev).toBe(false)
  })

  it('paginates items that fit one page', () => {
    const items = [1, 2, 3]
    const result = paginate(items, { ...defaultParams, page: 1, pageSize: 10 })
    expect(result.data).toEqual([1, 2, 3])
    expect(result.pagination.total).toBe(3)
    expect(result.pagination.totalPages).toBe(1)
    expect(result.pagination.hasNext).toBe(false)
    expect(result.pagination.hasPrev).toBe(false)
  })

  it('paginates items across multiple pages', () => {
    const items = Array.from({ length: 25 }, (_, i) => i + 1)
    const page1 = paginate(items, { ...defaultParams, page: 1, pageSize: 10 })
    expect(page1.data).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(page1.pagination.totalPages).toBe(3)
    expect(page1.pagination.hasNext).toBe(true)
    expect(page1.pagination.hasPrev).toBe(false)

    const page2 = paginate(items, { ...defaultParams, page: 2, pageSize: 10 })
    expect(page2.data).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20])
    expect(page2.pagination.hasNext).toBe(true)
    expect(page2.pagination.hasPrev).toBe(true)

    const page3 = paginate(items, { ...defaultParams, page: 3, pageSize: 10 })
    expect(page3.data).toEqual([21, 22, 23, 24, 25])
    expect(page3.pagination.hasNext).toBe(false)
    expect(page3.pagination.hasPrev).toBe(true)
  })

  it('returns empty data for out-of-range page', () => {
    const items = [1, 2, 3]
    const result = paginate(items, { ...defaultParams, page: 5, pageSize: 10 })
    expect(result.data).toEqual([])
    expect(result.pagination.total).toBe(3)
    expect(result.pagination.hasNext).toBe(false)
    expect(result.pagination.hasPrev).toBe(true)
  })
})

describe('getSkipTake', () => {
  it('calculates skip/take for page 1', () => {
    expect(getSkipTake({ ...defaultParams, page: 1, pageSize: 20 })).toEqual({ skip: 0, take: 20 })
  })

  it('calculates skip/take for page 2', () => {
    expect(getSkipTake({ ...defaultParams, page: 2, pageSize: 20 })).toEqual({ skip: 20, take: 20 })
  })

  it('handles different page sizes', () => {
    expect(getSkipTake({ ...defaultParams, page: 3, pageSize: 5 })).toEqual({ skip: 10, take: 5 })
  })
})

describe('paginationSchema', () => {
  it('applies defaults for empty input', () => {
    const result = paginationSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(20)
      expect(result.data.search).toBe('')
      expect(result.data.sortBy).toBe('createdAt')
      expect(result.data.sortOrder).toBe('desc')
    }
  })

  it('coerces string numbers to integers', () => {
    const result = paginationSchema.safeParse({ page: '3', pageSize: '10' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
      expect(result.data.pageSize).toBe(10)
    }
  })

  it('rejects page less than 1', () => {
    const result = paginationSchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects pageSize over 100', () => {
    const result = paginationSchema.safeParse({ pageSize: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid sortOrder', () => {
    const result = paginationSchema.safeParse({ sortOrder: 'random' })
    expect(result.success).toBe(false)
  })
})
