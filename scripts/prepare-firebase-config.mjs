import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { EMULATOR_FIREBASE_CONFIG } from './lib/emulatorFirebaseEnv.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'frontend/public/firebase-config.json')

const CONFIG_KEYS = [
  ['VITE_FIREBASE_API_KEY', 'apiKey'],
  ['VITE_FIREBASE_AUTH_DOMAIN', 'authDomain'],
  ['VITE_FIREBASE_PROJECT_ID', 'projectId'],
  ['VITE_FIREBASE_STORAGE_BUCKET', 'storageBucket'],
  ['VITE_FIREBASE_MESSAGING_SENDER_ID', 'messagingSenderId'],
  ['VITE_FIREBASE_APP_ID', 'appId'],
]

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

function readExistingConfig() {
  if (!existsSync(outPath)) return null

  try {
    const parsed = JSON.parse(readFileSync(outPath, 'utf8'))
    const hasValues = CONFIG_KEYS.some(([, configKey]) => {
      const value = parsed?.[configKey]
      return typeof value === 'string' && value.trim()
    })
    return hasValues ? parsed : null
  } catch {
    return null
  }
}

function pickConfigValue(envKey, configKey, existingConfig, fallbackConfig) {
  const fromEnv = process.env[envKey]?.trim()
  if (fromEnv) return fromEnv

  const fromExisting = existingConfig?.[configKey]
  if (typeof fromExisting === 'string' && fromExisting.trim()) {
    return fromExisting.trim()
  }

  const fromFallback = fallbackConfig?.[configKey]
  if (typeof fromFallback === 'string' && fromFallback.trim()) {
    return fromFallback.trim()
  }

  return ''
}

loadEnvFile()

const useEmulator = process.env.VITE_USE_FIREBASE_EMULATOR === 'true'
const existingConfig = readExistingConfig()
const fallbackConfig = useEmulator ? EMULATOR_FIREBASE_CONFIG : existingConfig

const firebaseConfig = Object.fromEntries(
  CONFIG_KEYS.map(([envKey, configKey]) => [
    configKey,
    pickConfigValue(envKey, configKey, existingConfig, fallbackConfig),
  ]),
)

writeFileSync(outPath, `${JSON.stringify(firebaseConfig, null, 2)}\n`)

const envKeys = CONFIG_KEYS.map(([envKey]) => envKey)
const missing = envKeys.filter((key) => !process.env[key]?.trim())
const isRemoteBuild =
  process.env.NETLIFY === 'true' ||
  process.env.CI === 'true' ||
  process.env.CONTEXT === 'production' ||
  process.env.CONTEXT === 'deploy-preview'

const isDemoConfig =
  firebaseConfig.projectId === 'demo-homework' ||
  firebaseConfig.apiKey.toLowerCase().includes('demokey')

const hasWrittenConfig = CONFIG_KEYS.every(
  ([, configKey]) => typeof firebaseConfig[configKey] === 'string' && firebaseConfig[configKey].trim(),
)

if (hasWrittenConfig && !isDemoConfig) {
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
} else if (!hasWrittenConfig) {
  console.warn(
    `Firebase env missing locally (${missing.join(', ')}). ` +
      'Create frontend/.env from frontend/.env.example or run npm run dev:all.',
  )
} else if (useEmulator) {
  console.log('Firebase config ready for local emulator.')
}
