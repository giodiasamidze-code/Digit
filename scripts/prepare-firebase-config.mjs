import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'frontend/public/firebase-config.json')

function loadEnvFile() {
  if (process.env.NETLIFY === 'true' || process.env.CI === 'true') return

  const envPath = join(root, 'frontend/.env')
  if (!existsSync(envPath)) return

  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile()

const envKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || '',
}

writeFileSync(outPath, `${JSON.stringify(firebaseConfig, null, 2)}\n`)

const missing = envKeys.filter((key) => !process.env[key]?.trim())
const isRemoteBuild =
  process.env.NETLIFY === 'true' ||
  process.env.CI === 'true' ||
  process.env.CONTEXT === 'production' ||
  process.env.CONTEXT === 'deploy-preview'

const isDemoConfig =
  firebaseConfig.projectId === 'demo-homework' ||
  firebaseConfig.apiKey.toLowerCase().includes('demokey')

if (missing.length === 0 && !isDemoConfig) {
  console.log('Firebase config ready for production build.')
} else if (isRemoteBuild) {
  console.error('\n❌ Netlify build failed: Firebase is not configured for production.\n')
  if (missing.length > 0) {
    console.error('Missing environment variables in Netlify (Site configuration → Environment variables):\n')
    missing.forEach((key) => console.error(`  • ${key}`))
  }
  if (isDemoConfig) {
    console.error('\n  • Demo/emulator values detected — use a real Firebase project, not demo-homework.')
  }
  console.error('\n  Also set: VITE_USE_FIREBASE_EMULATOR=false')
  console.error('  Then: Deploys → Trigger deploy → Clear cache and deploy site\n')
  process.exit(1)
} else if (missing.length > 0) {
  console.warn(`Firebase env missing locally (${missing.join(', ')}). Using frontend/.env if present.`)
}
