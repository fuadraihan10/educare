import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'prisma/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/generated/', 'src/app/', 'src/components/', 'e2e/'],
    },
    env: {
      UPLOAD_STORAGE_DIR: path.resolve(__dirname, 'tests/tmp-storage'),
      DATABASE_URL: 'postgresql://sms:test@localhost:5432/sms_test',
      AUTH_SECRET: 'test-secret-for-vitest-at-least-32-characters',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'server-only': path.resolve(__dirname, 'tests/stubs/server-only.ts'),
    },
  },
})
