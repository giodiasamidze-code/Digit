#!/usr/bin/env node
/**
 * Create or promote a production manager in digit-96a35.
 *
 * Prerequisites (once):
 *   firebase login
 *   gcloud auth application-default login   (or set GOOGLE_APPLICATION_CREDENTIALS)
 *
 * Usage:
 *   node scripts/seed-production-manager.mjs giorgidiasamidze848@gmail.com YourPassword123
 */
import admin from 'firebase-admin'
import { BOOTSTRAP_MANAGER_EMAILS } from './lib/bootstrapManagers.mjs'

const projectId = process.env.FIREBASE_PROJECT_ID || 'digit-96a35'
const email = (process.argv[2] || '').trim().toLowerCase()
const password = process.argv[3] || ''

if (!email) {
  console.error('Usage: node scripts/seed-production-manager.mjs <email> [password]')
  process.exit(1)
}

if (!BOOTSTRAP_MANAGER_EMAILS.includes(email)) {
  console.error(`Email must be in bootstrap list: ${BOOTSTRAP_MANAGER_EMAILS.join(', ')}`)
  process.exit(1)
}

if (!admin.apps.length) {
  admin.initializeApp({
    projectId,
    credential: admin.credential.applicationDefault(),
  })
}

const auth = admin.auth()
const db = admin.firestore()

async function ensureManager() {
  let user

  try {
    user = await auth.getUserByEmail(email)
    console.log(`Auth user exists: ${email}`)
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err
    if (!password || password.length < 6) {
      console.error('User not found. Provide a password (min 6 chars) to create the account.')
      process.exit(1)
    }
    user = await auth.createUser({ email, password, emailVerified: true })
    console.log(`Auth user created: ${email}`)
  }

  await db.doc(`users/${user.uid}`).set(
    {
      uid: user.uid,
      email,
      name: email.split('@')[0],
      role: 'manager',
      developerRequestStatus: 'none',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  await db.doc(`registrations/${user.uid}`).set(
    {
      uid: user.uid,
      email,
      name: email.split('@')[0],
      accountType: 'customer',
      role: 'manager',
      developerRequestStatus: 'none',
      registeredAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  )

  console.log(`Manager profile ready for ${email} (uid: ${user.uid})`)
}

ensureManager().catch((err) => {
  console.error(`Failed: ${err.message}`)
  console.error('\nRun once: firebase login && gcloud auth application-default login')
  process.exit(1)
})
