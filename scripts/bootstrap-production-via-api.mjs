#!/usr/bin/env node
/**
 * Bootstrap production manager using Firebase public Auth + Firestore REST APIs.
 * No service account required — uses the web API key from netlify.toml.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isBootstrapManagerEmail } from './lib/bootstrapManagers.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const netlifyToml = readFileSync(join(root, 'netlify.toml'), 'utf8')

function readTomlValue(key) {
  const match = netlifyToml.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]+)"`, 'm'))
  return match?.[1] || ''
}

const API_KEY = readTomlValue('VITE_FIREBASE_API_KEY')
const PROJECT_ID = readTomlValue('VITE_FIREBASE_PROJECT_ID') || 'digit-96a35'
const email = (process.argv[2] || 'giorgidiasamidze848@gmail.com').trim().toLowerCase()
const password = process.argv[3] || 'DigitManager2026!'

if (!API_KEY) {
  console.error('Missing VITE_FIREBASE_API_KEY in netlify.toml')
  process.exit(1)
}

if (!isBootstrapManagerEmail(email)) {
  console.error(`Email is not in bootstrap manager list: ${email}`)
  process.exit(1)
}

async function authRequest(path, body) {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/${path}?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, data }
}

async function getAuthSession() {
  const signUp = await authRequest('accounts:signUp', {
    email,
    password,
    returnSecureToken: true,
  })

  if (signUp.ok) {
    console.log(`Auth account created: ${email}`)
    return signUp.data
  }

  if (signUp.data?.error?.message !== 'EMAIL_EXISTS') {
    throw new Error(signUp.data?.error?.message || 'Auth signUp failed')
  }

  const signIn = await authRequest('accounts:signInWithPassword', {
    email,
    password,
    returnSecureToken: true,
  })

  if (!signIn.ok) {
    const message = signIn.data?.error?.message || 'Auth signIn failed'
    if (message === 'INVALID_LOGIN_CREDENTIALS') {
      const reset = await authRequest('accounts:sendOobCode', {
        requestType: 'PASSWORD_RESET',
        email,
      })
      if (reset.ok) {
        throw new Error(
          `Account exists with a different password. Password reset email sent to ${email}. ` +
            'Set a new password, then rerun with: npm run bootstrap-production -- email newPassword',
        )
      }
    }
    throw new Error(message)
  }

  console.log(`Signed in existing account: ${email}`)
  return signIn.data
}

function toFirestoreFields(obj) {
  const fields = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') fields[key] = { stringValue: value }
  }
  return fields
}

async function getUserDoc(idToken, uid) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${idToken}` } },
  )
  if (response.status === 404) return null
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Firestore read failed (${response.status}): ${text}`)
  }
  return response.json()
}

async function createUserDoc(idToken, uid, profile) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users?documentId=${uid}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: toFirestoreFields(profile) }),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Firestore user create failed (${response.status}): ${text}`)
  }
}

async function createRegistrationDoc(idToken, uid, profile) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/registrations?documentId=${uid}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields: toFirestoreFields(profile) }),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Firestore registration create failed (${response.status}): ${text}`)
  }
}

async function main() {
  console.log(`Bootstrapping production manager on ${PROJECT_ID}...\n`)

  const session = await getAuthSession()
  const { idToken, localId: uid } = session

  const userProfile = {
    uid,
    email,
    name: email.split('@')[0],
    role: 'manager',
    developerRequestStatus: 'none',
  }

  const registrationProfile = {
    uid,
    email,
    name: email.split('@')[0],
    accountType: 'customer',
    role: 'manager',
    developerRequestStatus: 'none',
  }

  const existing = await getUserDoc(idToken, uid)

  if (!existing) {
    await createUserDoc(idToken, uid, userProfile)
    console.log('Firestore users profile created (manager).')
  } else {
    const currentRole = existing.fields?.role?.stringValue
    if (currentRole === 'manager') {
      console.log('Firestore users profile already has manager role.')
    } else {
      throw new Error(
        `User exists with role "${currentRole || 'unknown'}". ` +
          'Delete the account in Firebase Console (Auth + Firestore users/registrations) and rerun, ' +
          'or run: npm run deploy:firestore then npm run seed-production-manager',
      )
    }
  }

  try {
    await createRegistrationDoc(idToken, uid, registrationProfile)
    console.log('Firestore registrations profile created.')
  } catch (err) {
    if (String(err.message).includes('409') || String(err.message).includes('ALREADY_EXISTS')) {
      console.log('Firestore registrations profile already exists.')
    } else {
      throw err
    }
  }

  console.log('\nProduction manager ready.')
  console.log(`  Email:    ${email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Admin:    https://YOUR-NETLIFY-SITE.netlify.app/admin`)
}

main().catch((err) => {
  console.error(`\nBootstrap failed: ${err.message}`)
  if (String(err.message).includes('OPERATION_NOT_ALLOWED')) {
    console.error('Enable Email/Password in Firebase Console → Authentication → Sign-in method.')
  }
  if (String(err.message).includes('PERMISSION_DENIED')) {
    console.error('Deploy Firestore rules first: npm run deploy:firestore')
  }
  process.exit(1)
})
