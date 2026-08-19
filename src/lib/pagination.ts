import { z } from 'zod'

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).default(''),
  sortBy: z.string().trim().max(50).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationParams = z.infer<typeof paginationSchema>

export type PaginatedResult<T> = {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function paginate<T>(
  items: T[],
  params: PaginationParams
): PaginatedResult<T> {
  const { page, pageSize } = params
  const total = items.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const data = items.slice(start, start + pageSize)
  
  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

// For Prisma queries with skip/take
export function getSkipTake(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.pageSize,
    take: params.pageSize,
  }
}
