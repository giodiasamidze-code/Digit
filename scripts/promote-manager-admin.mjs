#!/usr/bin/env node
/**
 * Promote an existing Firebase user to manager (requires Admin SDK / service account).
 * Used by GitHub Actions when FIREBASE_SERVICE_ACCOUNT secret is set.
 */
import admin from 'firebase-admin'
import { isBootstrapManagerEmail } from './lib/bootstrapManagers.mjs'

const email = (process.argv[2] || '').trim().toLowerCase()
const raw = process.env.FIREBASE_SERVICE_ACCOUNT

if (!email || !raw) {
  console.log('Skip: email or FIREBASE_SERVICE_ACCOUNT missing')
  process.exit(0)
}

if (!isBootstrapManagerEmail(email)) {
  console.error(`Email not in bootstrap list: ${email}`)
  process.exit(1)
}

const serviceAccount = JSON.parse(raw)

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || 'digit-96a35',
  })
}

const auth = admin.auth()
const db = admin.firestore()

const user = await auth.getUserByEmail(email)

await db.doc(`users/${user.uid}`).set(
  {
    uid: user.uid,
    email,
    name: email.split('@')[0],
    role: 'manager',
    developerRequestStatus: 'none',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  { merge: true },
)

console.log(`Promoted ${email} to manager (uid: ${user.uid})`)
