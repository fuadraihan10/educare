import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string(),
  AUTH_SECRET: z.string().min(32),
  AUTH_TRUST_HOST: z.string().default('true'),
  AUTH_URL: z.string().default('http://localhost:3000'),
  EMAIL_TRANSPORT: z.string().default('console'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  UPLOAD_STORAGE_DIR: z.string().default('storage'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  REDIS_URL: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SCHOOL_NAME: z.string().default('School'),
})

let cached: z.infer<typeof envSchema> | undefined

export const env = (() => {
  if (cached) return cached

  const result = envSchema.safeParse(process.env)

  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
    console.error('❌ Invalid environment variables:')
    issues.forEach(i => console.error(`  - ${i}`))
    throw new Error(`Environment validation failed:\n${issues.join('\n')}`)
  }

  cached = result.data
  return cached
})()
