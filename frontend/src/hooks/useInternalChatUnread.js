import { useEffect, useState } from 'react'
import { isInternalChatUnread, subscribeToInternalChats } from '../services/internalChatService'
import { isStaffRole } from '../utils/roles'

export function useInternalChatUnreadCount(userId, role) {
  const staffEnabled = Boolean(userId && isStaffRole(role))
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!staffEnabled) return undefined

    let cancelled = false

    const unsubscribe = subscribeToInternalChats(
      userId,
      (chats) => {
        if (!cancelled) {
          setCount(chats.filter((chat) => isInternalChatUnread(chat, userId)).length)
        }
      },
      () => {
        if (!cancelled) setCount(0)
      },
    )

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [userId, staffEnabled])

  return staffEnabled ? count : 0
}
