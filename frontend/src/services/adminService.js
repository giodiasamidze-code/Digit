import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { DEVELOPER_REQUEST_STATUS } from '../utils/roles'
import { updateUserRegistration } from './registrationService'

function requireDb() {
  if (!db) {
    throw new Error('Firebase არ არის კონფიგურირებული.')
  }
  return db
}

export function subscribeToDeveloperRequestsByStatus(status, onRequests, onError) {
  const firestore = requireDb()
  const statusQuery = query(
    collection(firestore, 'users'),
    where('developerRequestStatus', '==', status),
  )

  return onSnapshot(
    statusQuery,
    (snapshot) => {
      const requests = snapshot.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
        .sort((a, b) => {
          const aTime = getRequestSortTime(a, status)
          const bTime = getRequestSortTime(b, status)
          return bTime - aTime
        })
      onRequests(requests)
    },
    onError,
  )
}

function getRequestSortTime(request, status) {
  if (status === DEVELOPER_REQUEST_STATUS.PENDING) {
    return request.developerRequestedAt?.toMillis?.() ?? 0
  }
  return request.developerReviewedAt?.toMillis?.() ?? 0
}

export function subscribeToPendingDeveloperRequests(onRequests, onError) {
  return subscribeToDeveloperRequestsByStatus(
    DEVELOPER_REQUEST_STATUS.PENDING,
    onRequests,
    onError,
  )
}

export function formatDeveloperRequestDate(timestamp) {
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

export function getDeveloperRequestInitials(name, email) {
  const source = (name || email || '?').trim()
  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return source.slice(0, 2).toUpperCase()
}

export async function approveDeveloperRequest(userId, reviewerId) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'users', userId), {
    role: 'developer',
    developerRequestStatus: DEVELOPER_REQUEST_STATUS.APPROVED,
    developerReviewedAt: serverTimestamp(),
    developerReviewedBy: reviewerId,
  })

  await updateUserRegistration(userId, {
    role: 'developer',
    accountType: 'developer',
    developerRequestStatus: DEVELOPER_REQUEST_STATUS.APPROVED,
    reviewedAt: serverTimestamp(),
    reviewedBy: reviewerId,
  })
}

export async function rejectDeveloperRequest(userId, reviewerId) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'users', userId), {
    role: 'customer',
    developerRequestStatus: DEVELOPER_REQUEST_STATUS.REJECTED,
    developerReviewedAt: serverTimestamp(),
    developerReviewedBy: reviewerId,
  })

  await updateUserRegistration(userId, {
    role: 'customer',
    accountType: 'developer',
    developerRequestStatus: DEVELOPER_REQUEST_STATUS.REJECTED,
    reviewedAt: serverTimestamp(),
    reviewedBy: reviewerId,
  })
}
