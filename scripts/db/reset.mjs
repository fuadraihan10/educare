import { rmSync } from 'node:fs'
import { dataDir, isRunning, pgBin, projectRoot, run } from './lib.mjs'

if (!process.argv.includes('--yes')) {
  console.error('Refusing to run without --yes. This destroys the dev database at .postgres/.')
  process.exit(1)
}

if (isRunning()) {
  run(join(pgBin, 'pg_ctl.exe'), ['-D', dataDir, 'stop', '-m', 'fast'])
}
rmSync(projectRoot + '/.postgres/data', { recursive: true, force: true })
console.log('Dev cluster data removed. Re-run `npm run db:init` to recreate it.')
