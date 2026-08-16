import { dataDir, isRunning, logFile, pgBin, port, run } from './lib.mjs'

if (isRunning()) {
  console.log('Postgres already running.')
} else {
  run(join(pgBin, 'pg_ctl.exe'), ['-D', dataDir, '-l', logFile, '-o', `-p ${port}`, 'start'])
  console.log(`Postgres started on 127.0.0.1:${port}`)
}
