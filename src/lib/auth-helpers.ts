import { z } from 'zod'

export const credentialsSchema = z.object({
  regNo: z.string().trim().min(1, 'Registration number is required.').max(50).transform((v) => v.toUpperCase().trim()),
  password: z.string().min(1).max(255),
})

export type Credentials = z.infer<typeof credentialsSchema>

export function resolveIp(headers: Headers): string {
  if (process.env.NODE_ENV === 'production') {
    const forwarded = headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0]?.trim() ?? 'unknown'
    }
  }
  return 'dev'
}
