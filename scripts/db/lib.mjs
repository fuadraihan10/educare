import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
export const projectRoot = resolve(__dirname, '../..')
export const dataDir = join(projectRoot, '.postgres', 'data')
export const logFile = join(projectRoot, '.postgres', 'db.log')
export const passwordFile = join(projectRoot, '.postgres', '.devpassword')
export const pgBin = process.env.PGDEV_BIN || join(process.env.USERPROFILE || process.env.HOME || '', 'pgsql', 'pgsql', 'bin')
export const port = process.env.PGDEV_PORT || '5433'
export const dbName = process.env.PGDEV_DB || 'sms'
export const superuser = process.env.PGDEV_USER || 'sms'

export function getOrCreatePassword() {
  if (existsSync(passwordFile)) {
    return readFileSync(passwordFile, 'utf8').trim()
  }
  const password = randomBytes(18).toString('base64url')
  mkdirSync(join(projectRoot, '.postgres'), { recursive: true })
  writeFileSync(passwordFile, password, { mode: 0o600 })
  return password
}

export function run(bin, args, opts = {}) {
  const result = spawnSync(bin, args, {
    encoding: 'utf8',
    stdio: opts.quiet ? 'pipe' : 'inherit',
    env: { ...process.env, PGSSLMODE: 'disable' },
    ...opts,
  })
  if (result.status !== 0 && !opts.allowFail) {
    process.stderr.write(result.stderr || result.stdout || '')
    process.exit(result.status ?? 1)
  }
  return result
}

export function isRunning() {
  const pidFile = join(dataDir, 'postmaster.pid')
  if (!existsSync(pidFile)) return false
  const [pid] = readFileSync(pidFile, 'utf8').split('\n')
  if (!pid) return false
  return spawnSync('tasklist', ['/FI', `PID eq ${pid}`], { encoding: 'utf8', stdio: 'pipe' }).stdout.includes(pid)
}

export function psqlArgs(password) {
  return [
    '-h', '127.0.0.1',
    '-p', port,
    '-U', superuser,
    '-d', dbName,
    '--set', `PGPASSWORD=${password}`,
  ]
}
