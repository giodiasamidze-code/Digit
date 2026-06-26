import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import bundledConfig from '../public/firebase-config.json'

function pickConfigValue(envValue, bundledValue) {
  if (envValue && typeof envValue === 'string' && envValue.trim()) {
    return envValue.trim()
  }
  if (bundledValue && typeof bundledValue === 'string' && bundledValue.trim()) {
    return bundledValue.trim()
  }
  return ''
}

const firebaseConfig = {
  apiKey: pickConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, bundledConfig.apiKey),
  authDomain: pickConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, bundledConfig.authDomain),
  projectId: pickConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, bundledConfig.projectId),
  storageBucket: pickConfigValue(
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    bundledConfig.storageBucket,
  ),
  messagingSenderId: pickConfigValue(
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    bundledConfig.messagingSenderId,
  ),
  appId: pickConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, bundledConfig.appId),
}

const PLACEHOLDER_PATTERNS = ['your_', 'placeholder']
const DEMO_PROJECT_IDS = ['demo-homework']

function isMissingOrPlaceholder(value) {
  if (!value || typeof value !== 'string') return true
  const lower = value.toLowerCase()
  if (PLACEHOLDER_PATTERNS.some((p) => lower.includes(p))) return true
  if (lower.includes('demokey') || lower.includes('forlocal')) return true
  return false
}

const missingKeys = Object.entries({
  VITE_FIREBASE_API_KEY: firebaseConfig.apiKey,
  VITE_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  VITE_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  VITE_FIREBASE_STORAGE_BUCKET: firebaseConfig.storageBucket,
  VITE_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  VITE_FIREBASE_APP_ID: firebaseConfig.appId,
})
  .filter(([, value]) => isMissingOrPlaceholder(value))
  .map(([key]) => key)

export const isFirebaseConfigured = (() => {
  const hasAllValues = Object.values(firebaseConfig).every(
    (value) => value && !isMissingOrPlaceholder(value),
  )
  if (!hasAllValues) return false
  if (import.meta.env.PROD && DEMO_PROJECT_IDS.includes(firebaseConfig.projectId)) return false
  return true
})()

export const useFirebaseEmulator =
  import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' && import.meta.env.DEV

let auth = null
let db = null

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)

  if (useFirebaseEmulator) {
    const emulatorKey = '__HOMEWORK_FIREBASE_EMULATORS__'

    if (!globalThis[emulatorKey]) {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
      connectFirestoreEmulator(db, '127.0.0.1', 8080)
      globalThis[emulatorKey] = true

      console.info('[Firebase] Emulator mode: Auth :9099, Firestore :8080, UI http://127.0.0.1:4000')
    }
  }
} else if (import.meta.env.DEV) {
  console.warn(
    `[Firebase] კონფიგურაცია არ არის დაყენებული: ${missingKeys.join(', ')}. ` +
      'შეავსე frontend/.env ფაილი და გადატვირთე dev server.',
  )
}

export { auth, db }
