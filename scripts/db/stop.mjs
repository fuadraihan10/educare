import { dataDir, isRunning, pgBin, run } from './lib.mjs'

if (isRunning()) {
  run(join(pgBin, 'pg_ctl.exe'), ['-D', dataDir, 'stop', '-m', 'fast'])
  console.log('Postgres stopped.')
} else {
  console.log('Postgres is not running.')
}
