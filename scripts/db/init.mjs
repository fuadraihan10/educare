import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { dataDir, dbName, getOrCreatePassword, isRunning, logFile, pgBin, port, projectRoot, run, superuser } from './lib.mjs'

const password = getOrCreatePassword()

if (existsSync(join(dataDir, 'PG_VERSION'))) {
  console.log('Cluster already initialized. Run `npm run db:start` if it is not running.')
} else {
  mkdirSync(projectRoot + '/.postgres', { recursive: true })
  const pwfile = join(projectRoot, '.postgres', '.initpw')
  const { writeFileSync } = await import('node:fs')
  writeFileSync(pwfile, password, { mode: 0o600 })
  run(join(pgBin, 'initdb.exe'), ['-D', dataDir, '-U', superuser, '-A', 'scram-sha-256', `--pwfile=${pwfile}`])
  const { appendFileSync } = await import('node:fs')
  const conf = join(dataDir, 'postgresql.conf')
  appendFileSync(conf, [
    '',
    '# Dev tuning (required on this machine: HVCI/Memory Integrity breaks child',
    '# shared-memory reservation with larger regions; small buffers keep the',
    '# postmaster region clear of randomized system DLL bases).',
    `shared_buffers = 16MB`,
    `max_connections = 20`,
    '',
  ].join('\n'))
  run(join(pgBin, 'pg_ctl.exe'), ['-D', dataDir, '-l', logFile, '-o', `-p ${port}`, 'start'])
}

if (!isRunning()) {
  run(join(pgBin, 'pg_ctl.exe'), ['-D', dataDir, '-l', logFile, '-o', `-p ${port}`, 'start'])
}

const dbExists = run(join(pgBin, 'psql.exe'), ['-h', '127.0.0.1', '-p', port, '-U', superuser, '-d', 'postgres', '-tAc', `SELECT 1 FROM pg_database WHERE datname='${dbName}'`], { quiet: true }).stdout.trim() === '1'
if (!dbExists) {
  run(join(pgBin, 'createdb.exe'), ['-h', '127.0.0.1', '-p', port, '-U', superuser, dbName])
}
console.log(`Postgres ready on 127.0.0.1:${port} (user=${superuser}, db=${dbName})`)
