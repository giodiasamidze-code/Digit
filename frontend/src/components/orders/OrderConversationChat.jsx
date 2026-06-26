import { useEffect, useState } from 'react'
import ClickActionsPanel from '../ClickActionsPanel'
import { DEVELOPER_ORDER_ACTIONS } from '../../constants/clickActions'
import {
  sendStaffMessage,
  subscribeToMessages,
} from '../../services/chatService'
import './OrderConversationChat.css'

function OrderConversationChat({ conversationId, userId, customerName }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sentActionId, setSentActionId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!conversationId) return undefined

    const unsubscribe = subscribeToMessages(
      conversationId,
      (list) => {
        setMessages(list)
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'მოქმედებების ჩატვირთვა ვერ მოხერხდა.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [conversationId])

  const handleAction = async (action) => {
    if (!conversationId || !userId || sending) return

    setSending(true)
    setSentActionId(action.id)
    setError('')

    try {
      await sendStaffMessage(conversationId, {
        senderId: userId,
        senderRole: 'developer',
        text: action.message,
      })
    } catch (err) {
      setError(err.message || 'მოქმედების გაგზავნა ვერ მოხერხდა.')
    } finally {
      setSending(false)
      setSentActionId(null)
    }
  }

  if (!conversationId) {
    return <p className="order-chat__empty">მოთხოვნის ID არ მოიძებნა.</p>
  }

  return (
    <div className="order-chat">
      <div className="order-chat__header">
        <h3 className="order-chat__title">მომხმარებელი: {customerName}</h3>
      </div>

      {error && <div className="order-chat__error">{error}</div>}

      <ClickActionsPanel
        actions={DEVELOPER_ORDER_ACTIONS}
        messages={messages}
        loading={loading}
        sending={sending}
        sentActionId={sentActionId}
        onAction={handleAction}
        emptyHint="აირჩიეთ მოქმედება მომხმარებლისთვის."
        actionsLabel="მოქმედება მომხმარებლისთვის"
        viewerRole="staff"
      />
    </div>
  )
}

export default OrderConversationChat
