#!/usr/bin/env node
// Full reset: drops, recreates, migrates, seeds, then opens Prisma Studio.
// Usage: node scripts/db/reset.mjs

import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '..', '..')
const envPath = resolve(projectRoot, '.env')

if (!existsSync(envPath)) {
  console.error('.env not found')
  process.exit(1)
}

const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    })
)

const dbUrl = env.DATABASE_URL
if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env')
  process.exit(1)
}

const base = { stdio: 'inherit', env: { ...process.env, DATABASE_URL: dbUrl }, cwd: projectRoot }

console.log('\n══════════════════════════════════════════')
console.log('  1/3  Resetting database')
console.log('══════════════════════════════════════════\n')
execSync('npx prisma migrate reset --force --schema prisma/schema.prisma', base)

console.log('\n══════════════════════════════════════════')
console.log('  2/3  Database ready')
console.log('══════════════════════════════════════════')
console.log('  migrate + seed completed via prisma migrate reset.\n')

console.log('══════════════════════════════════════════')
console.log('  3/3  Opening Prisma Studio')
console.log('══════════════════════════════════════════\n')

try {
  execSync('npx prisma studio --schema prisma/schema.prisma', { ...base, stdio: 'inherit' })
} catch {
  // Studio opened in browser; process exits when user closes it
}

console.log('\n✅ Done.')
