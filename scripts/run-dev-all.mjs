import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runFirebase, runNodeScript, getProjectEnv } from './runFirebase.mjs'
import { applyEmulatorFirebaseEnv } from './lib/emulatorFirebaseEnv.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

runNodeScript(join(root, 'scripts', 'free-emulator-ports.mjs'))
runFirebase(
  'emulators:exec --only auth,firestore --project demo-homework "npm run dev:emulator"',
  applyEmulatorFirebaseEnv(getProjectEnv()),
)
