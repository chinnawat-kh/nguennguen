import { spawnSync } from 'node:child_process'
import electronPath from 'electron'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { env, stdio: 'inherit', shell: false })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(process.execPath, ['--experimental-strip-types', '--test', 'tests/core.test.ts'])
run(electronPath, ['--experimental-strip-types', '--test', 'tests/migration.test.ts'], {
  ...process.env,
  ELECTRON_RUN_AS_NODE: '1'
})
