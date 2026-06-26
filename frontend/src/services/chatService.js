import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { deleteCollectionDocuments } from '../utils/firestoreBatch'

export const MESSAGE_TYPE = {
  TEXT: 'text',
  SERVICE_REQUEST: 'service_request',
  PRICE_OFFER: 'price_offer',
  SYSTEM: 'system',
}

function requireDb() {
  if (!db) {
    throw new Error('Firebase არ არის კონფიგურირებული.')
  }
  return db
}

async function updateConversationMeta(conversationId, text) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'conversations', conversationId), {
    lastMessageAt: serverTimestamp(),
    lastMessageText: text.slice(0, 120),
  })
}

function messagesCollection(firestore, conversationId) {
  return collection(firestore, 'conversations', conversationId, 'messages')
}

export async function findOrCreateOpenConversation({
  customerId,
  customerName,
  type,
  serviceRequested = null,
}) {
  const firestore = requireDb()
  const conversationsRef = collection(firestore, 'conversations')
  const filters = [
    where('customerId', '==', customerId),
    where('type', '==', type),
    where('status', '==', 'open'),
  ]

  if (serviceRequested) {
    filters.push(where('serviceRequested', '==', serviceRequested))
  }

  const openQuery = query(conversationsRef, ...filters)
  const snapshot = await getDocs(openQuery)

  if (!snapshot.empty) {
    return snapshot.docs[0].id
  }

  const newConversation = await addDoc(conversationsRef, {
    customerId,
    customerName,
    type,
    status: 'open',
    serviceRequested,
    assignedDeveloperId: null,
    lastMessageText: '',
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  })

  return newConversation.id
}

export function subscribeToConversations(staffType, status, onConversations, onError) {
  const firestore = requireDb()
  const conversationsQuery = query(
    collection(firestore, 'conversations'),
    where('type', '==', staffType),
    where('status', '==', status),
    orderBy('lastMessageAt', 'desc'),
  )

  return onSnapshot(
    conversationsQuery,
    (snapshot) => {
      const conversations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))
      onConversations(conversations)
    },
    onError,
  )
}

export function subscribeToMessages(conversationId, onMessages, onError) {
  const firestore = requireDb()
  const messagesQuery = query(
    messagesCollection(firestore, conversationId),
    orderBy('createdAt', 'asc'),
  )

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages = snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        ...messageDoc.data(),
      }))
      onMessages(messages)
    },
    onError,
  )
}

export async function sendCustomerMessage(conversationId, { senderId, text }) {
  const firestore = requireDb()
  await addDoc(messagesCollection(firestore, conversationId), {
    type: MESSAGE_TYPE.TEXT,
    senderId,
    senderRole: 'customer',
    text,
    createdAt: serverTimestamp(),
  })
  await updateConversationMeta(conversationId, text)
}

export async function sendStaffMessage(conversationId, { senderId, senderRole, text }) {
  const firestore = requireDb()
  await addDoc(messagesCollection(firestore, conversationId), {
    type: MESSAGE_TYPE.TEXT,
    senderId,
    senderRole,
    text,
    createdAt: serverTimestamp(),
  })
  await updateConversationMeta(conversationId, text)
}

export async function sendServiceRequestMessage(conversationId, { senderId, serviceType, text }) {
  const firestore = requireDb()
  await addDoc(messagesCollection(firestore, conversationId), {
    type: MESSAGE_TYPE.SERVICE_REQUEST,
    senderId,
    senderRole: 'customer',
    text,
    serviceType,
    createdAt: serverTimestamp(),
  })
  await updateConversationMeta(conversationId, text)
}

export async function sendPriceOffer(
  conversationId,
  { senderId, senderRole, price, description, serviceType = '' },
) {
  const firestore = requireDb()
  const numericPrice = Number(price)
  const text = `ფასის შეთავაზება: ${numericPrice} ₾`

  await addDoc(messagesCollection(firestore, conversationId), {
    type: MESSAGE_TYPE.PRICE_OFFER,
    senderId,
    senderRole,
    text,
    price: numericPrice,
    description: description.trim(),
    serviceType: serviceType.trim(),
    status: 'pending',
    createdAt: serverTimestamp(),
  })
  await updateConversationMeta(conversationId, text)
}

export async function acceptPriceOffer(
  conversationId,
  messageId,
  { customerId, customerName, serviceType },
) {
  const firestore = requireDb()
  const messageRef = doc(firestore, 'conversations', conversationId, 'messages', messageId)
  const convRef = doc(firestore, 'conversations', conversationId)

  return runTransaction(firestore, async (transaction) => {
    const offerSnap = await transaction.get(messageRef)
    if (!offerSnap.exists()) {
      throw new Error('შეთავაზება ვერ მოიძებნა.')
    }

    const offer = offerSnap.data()
    if (offer.type !== MESSAGE_TYPE.PRICE_OFFER || offer.status !== 'pending') {
      throw new Error('ALREADY_RESPONDED')
    }

    transaction.update(messageRef, { status: 'accepted' })

    const systemText = `✓ ფასი ${offer.price} ლარი დათანხმებულია`
    const systemRef = doc(messagesCollection(firestore, conversationId))
    transaction.set(systemRef, {
      type: MESSAGE_TYPE.SYSTEM,
      senderRole: 'system',
      text: systemText,
      createdAt: serverTimestamp(),
    })

    const orderRef = doc(collection(firestore, 'orders'))
    transaction.set(orderRef, {
      conversationId,
      customerId,
      customerName,
      serviceType: serviceType || offer.serviceType || 'სერვისი',
      description: offer.description || '',
      status: 'new',
      assignedDeveloperId: null,
      assignedDeveloperName: null,
      managerNotes: [],
      price: offer.price,
      paymentStatus: 'unpaid',
      developerPayout: null,
      payoutStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    transaction.update(convRef, {
      lastMessageAt: serverTimestamp(),
      lastMessageText: systemText.slice(0, 120),
    })

    return orderRef.id
  })
}

export async function declinePriceOffer(conversationId, messageId, reason = '') {
  const firestore = requireDb()
  const messageRef = doc(firestore, 'conversations', conversationId, 'messages', messageId)
  const convRef = doc(firestore, 'conversations', conversationId)

  return runTransaction(firestore, async (transaction) => {
    const offerSnap = await transaction.get(messageRef)
    if (!offerSnap.exists()) {
      throw new Error('შეთავაზება ვერ მოიძებნა.')
    }

    const offer = offerSnap.data()
    if (offer.type !== MESSAGE_TYPE.PRICE_OFFER || offer.status !== 'pending') {
      throw new Error('ALREADY_RESPONDED')
    }

    transaction.update(messageRef, { status: 'declined' })

    const trimmedReason = reason.trim()
    const systemText = trimmedReason
      ? `✕ შეთავაზება უარყოფილია. ${trimmedReason}`
      : '✕ შეთავაზება უარყოფილია'

    const systemRef = doc(messagesCollection(firestore, conversationId))
    transaction.set(systemRef, {
      type: MESSAGE_TYPE.SYSTEM,
      senderRole: 'system',
      text: systemText,
      createdAt: serverTimestamp(),
    })

    transaction.update(convRef, {
      lastMessageAt: serverTimestamp(),
      lastMessageText: systemText.slice(0, 120),
    })
  })
}

export async function closeConversation(conversationId) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'conversations', conversationId), {
    status: 'closed',
  })
}

export async function deleteConversation(conversationId) {
  const firestore = requireDb()
  await deleteCollectionDocuments(firestore, ['conversations', conversationId, 'messages'])
  await deleteDoc(doc(firestore, 'conversations', conversationId))
}

export function formatMessageTime(timestamp) {
  if (!timestamp) return ''

  const date =
    typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleTimeString('ka-GE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return ''

  const date =
    typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp)

  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'ახლახან'
  if (diffMins < 60) return `${diffMins} წუთის წინ`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} საათის წინ`

  return date.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short' })
}

export function getMessageType(message) {
  return message?.type || MESSAGE_TYPE.TEXT
}
