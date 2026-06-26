#!/usr/bin/env node
/**
 * One-shot production setup helper.
 * - Builds frontend with frontend/.env
 * - Deploys Firestore if Firebase CLI is logged in
 * - Deploys to Netlify if NETLIFY_AUTH_TOKEN is set
 */
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const envPath = join(root, 'frontend/.env')

function run(label, command, args, extraEnv = {}) {
  console.log(`\n→ ${label}`)
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, ...extraEnv },
  })
  return result.status === 0
}

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error('Missing frontend/.env — add Firebase config first.')
    process.exit(1)
  }
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i === -1) continue
    const key = trimmed.slice(0, i).trim()
    const value = trimmed.slice(i + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnv()

console.log('DIGIT production setup\n')

if (!run('Build frontend', 'npm', ['run', 'build'])) {
  process.exit(1)
}

const firebaseBin =
  process.platform === 'win32'
    ? join(root, 'node_modules', '.bin', 'firebase.cmd')
    : join(root, 'node_modules', '.bin', 'firebase')

const firebaseCheck = spawnSync(firebaseBin, ['projects:list'], {
  cwd: root,
  shell: false,
  encoding: 'utf8',
})

if (firebaseCheck.status === 0) {
  run('Deploy Firestore rules', 'node', ['scripts/deploy-firestore.mjs'])
} else {
  console.log('\n⚠ Firebase CLI not logged in. Run once in terminal:')
  console.log('   firebase login')
  console.log('   npm run deploy:firestore')
}

if (process.env.NETLIFY_AUTH_TOKEN) {
  run('Deploy to Netlify', 'npx', [
    'netlify',
    'deploy',
    '--prod',
    '--dir=frontend/dist',
    '--message=Production deploy',
  ])
} else {
  console.log('\n✓ GitHub push triggers Netlify auto-deploy when repo is linked.')
  console.log('  Firebase env is in netlify.toml — no manual env setup needed.')
}

console.log('\nDone.')
