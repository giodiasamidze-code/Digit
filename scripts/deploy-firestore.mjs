#!/usr/bin/env node
/**
 * Deploy Firestore rules + indexes to digit-96a35.
 * Requires: npx firebase login (once, in your browser)
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const firebaseBin = join(root, 'node_modules', '.bin', 'firebase.cmd')

function run(args) {
  const result = spawnSync(firebaseBin, args, {
    cwd: root,
    stdio: 'inherit',
    shell: false,
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('Deploying Firestore rules and indexes to digit-96a35...\n')
run(['deploy', '--only', 'firestore', '--project', 'digit-96a35'])
console.log('\nDone.')
