import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

export const ACCOUNT_TYPE_LABELS = {
  customer: 'მომხმარებელი',
  developer: 'დეველოპერი',
}

export const REGISTRATION_STATUS_LABELS = {
  none: 'აქტიური',
  pending: 'მოლოდინში',
  approved: 'დადასტურებული',
  rejected: 'უარყოფილი',
}

function requireDb() {
  if (!db) {
    throw new Error('Firebase არ არის კონფიგურირებული.')
  }
  return db
}

export async function saveUserRegistration(uid, data) {
  const firestore = requireDb()
  const registrationRef = doc(firestore, 'registrations', uid)
  const existing = await getDoc(registrationRef)
  const timestamp = serverTimestamp()

  await setDoc(
    registrationRef,
    {
      uid,
      ...data,
      registeredAt: existing.exists() ? existing.data().registeredAt : timestamp,
      updatedAt: timestamp,
    },
    { merge: true },
  )
}

export async function updateUserRegistration(uid, data) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'registrations', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function ensureUserRegistrationFromProfile(uid, profile) {
  if (!profile?.email) return

  const firestore = requireDb()
  const registrationRef = doc(firestore, 'registrations', uid)
  const existing = await getDoc(registrationRef)

  if (existing.exists()) return

  const accountType =
    profile.developerRequestStatus === 'pending' ||
    profile.developerRequestStatus === 'approved' ||
    profile.developerRequestStatus === 'rejected'
      ? 'developer'
      : 'customer'

  await setDoc(registrationRef, {
    uid,
    name: profile.name || 'უსახელო',
    email: profile.email,
    accountType,
    role: profile.role || 'customer',
    developerRequestStatus: profile.developerRequestStatus || 'none',
    registeredAt: profile.createdAt || serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function subscribeToAllRegistrations(onRegistrations, onError) {
  const firestore = requireDb()
  const registrationsQuery = query(
    collection(firestore, 'registrations'),
    orderBy('registeredAt', 'desc'),
  )

  return onSnapshot(
    registrationsQuery,
    (snapshot) => {
      const registrations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      onRegistrations(registrations)
    },
    onError,
  )
}

export function formatRegistrationDate(timestamp) {
  if (!timestamp) return '—'

  const date =
    typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('ka-GE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}
