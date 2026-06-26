import { useEffect, useRef, useState } from 'react'
import { formatMessageTime, getMessageType, MESSAGE_TYPE } from '../services/chatService'
import './ClickActionsPanel.css'

function getBubbleClass(message, viewerRole) {
  const { senderRole, senderId } = message
  const currentUserId = message._viewerId

  if (currentUserId && senderId) {
    return senderId === currentUserId
      ? 'click-actions__bubble--staff'
      : 'click-actions__bubble--customer'
  }

  const isOwn =
    viewerRole === 'customer'
      ? senderRole === 'customer'
      : senderRole !== 'customer'

  if (viewerRole === 'customer') {
    return isOwn ? 'click-actions__bubble--user' : 'click-actions__bubble--bot'
  }

  return isOwn ? 'click-actions__bubble--staff' : 'click-actions__bubble--customer'
}

function ServiceRequestCard({ message }) {
  return (
    <div className="click-actions__service-request">
      <span className="click-actions__service-request-label">სერვისის მოთხოვნა</span>
      <p>{message.text}</p>
      {message.serviceType && (
        <span className="click-actions__service-request-type">{message.serviceType}</span>
      )}
    </div>
  )
}

function SystemNotice({ message }) {
  return (
    <div className="click-actions__system">
      <p>{message.text}</p>
    </div>
  )
}

function PriceOfferCard({
  message,
  viewerRole,
  onAcceptOffer,
  onDeclineOffer,
  respondingOfferId,
}) {
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [declineReason, setDeclineReason] = useState('')
  const isCustomer = viewerRole === 'customer'
  const isPending = message.status === 'pending'
  const isResponding = respondingOfferId === message.id
  const isDisabled = respondingOfferId != null

  const handleDecline = () => {
    if (!onDeclineOffer || isDisabled) return
    onDeclineOffer(message.id, declineReason)
  }

  return (
    <div className="click-actions__offer">
      <span className="click-actions__offer-label">ფასის შეთავაზება</span>
      <div className="click-actions__offer-price">{message.price} ₾</div>
      {message.description && (
        <p className="click-actions__offer-desc">{message.description}</p>
      )}

      {isPending && isCustomer && onAcceptOffer && onDeclineOffer ? (
        <div className="click-actions__offer-actions">
          {!showDeclineForm ? (
            <>
              <button
                type="button"
                className="click-actions__offer-btn click-actions__offer-btn--accept"
                disabled={isDisabled}
                onClick={() => onAcceptOffer(message.id)}
              >
                {isResponding ? '...' : '✓ დათანხმება'}
              </button>
              <button
                type="button"
                className="click-actions__offer-btn click-actions__offer-btn--decline"
                disabled={isDisabled}
                onClick={() => setShowDeclineForm(true)}
              >
                ✕ უარყოფა
              </button>
            </>
          ) : (
            <div className="click-actions__offer-decline">
              <textarea
                rows={2}
                placeholder="რატომ? (არასავალდებულო)"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                disabled={isDisabled}
              />
              <div className="click-actions__offer-decline-actions">
                <button
                  type="button"
                  className="click-actions__offer-btn click-actions__offer-btn--decline"
                  disabled={isDisabled}
                  onClick={handleDecline}
                >
                  {isResponding ? '...' : 'დადასტურება'}
                </button>
                <button
                  type="button"
                  className="click-actions__offer-btn click-actions__offer-btn--ghost"
                  disabled={isDisabled}
                  onClick={() => {
                    setShowDeclineForm(false)
                    setDeclineReason('')
                  }}
                >
                  გაუქმება
                </button>
              </div>
            </div>
          )}
        </div>
      ) : message.status === 'accepted' ? (
        <span className="click-actions__offer-badge click-actions__offer-badge--accepted">
          შეთავაზება მიღებულია ✓
        </span>
      ) : message.status === 'declined' ? (
        <span className="click-actions__offer-badge click-actions__offer-badge--declined">
          შეთავაზება უარყოფილია
        </span>
      ) : null}

      {message.createdAt && (
        <time className="click-actions__time">{formatMessageTime(message.createdAt)}</time>
      )}
    </div>
  )
}

function MessageItem({
  message,
  viewerRole,
  currentUserId,
  onAcceptOffer,
  onDeclineOffer,
  respondingOfferId,
}) {
  const type = getMessageType(message)

  if (type === MESSAGE_TYPE.SERVICE_REQUEST) {
    return (
      <div className="click-actions__message click-actions__message--request">
        <ServiceRequestCard message={message} />
        {message.createdAt && (
          <time className="click-actions__time">{formatMessageTime(message.createdAt)}</time>
        )}
      </div>
    )
  }

  if (type === MESSAGE_TYPE.SYSTEM) {
    return (
      <div className="click-actions__message click-actions__message--system">
        <SystemNotice message={message} />
      </div>
    )
  }

  if (type === MESSAGE_TYPE.PRICE_OFFER) {
    return (
      <div className="click-actions__message click-actions__message--offer">
        <PriceOfferCard
          message={message}
          viewerRole={viewerRole}
          onAcceptOffer={onAcceptOffer}
          onDeclineOffer={onDeclineOffer}
          respondingOfferId={respondingOfferId}
        />
      </div>
    )
  }

  return (
    <div
      className={`click-actions__bubble ${getBubbleClass({ ...message, _viewerId: currentUserId }, viewerRole)}`}
    >
      <p>{message.text}</p>
      {message.createdAt && (
        <time className="click-actions__time">{formatMessageTime(message.createdAt)}</time>
      )}
    </div>
  )
}

function ClickActionsPanel({
  actions,
  messages = [],
  loading = false,
  disabled = false,
  sending = false,
  onAction,
  emptyHint = 'აირჩიეთ მოქმედება ქვემოთ.',
  actionsLabel = 'აირჩიეთ მოქმედება',
  historyLabel = 'მოქმედებების ისტორია',
  viewerRole = 'customer',
  sentActionId = null,
  currentUserId = null,
  onAcceptOffer = null,
  onDeclineOffer = null,
  respondingOfferId = null,
  headerExtra = null,
}) {
  const historyEndRef = useRef(null)

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, respondingOfferId])

  return (
    <div className="click-actions">
      {headerExtra}

      <div className="click-actions__history" aria-live="polite">
        {loading ? (
          <p className="click-actions__empty">იტვირთება...</p>
        ) : messages.length === 0 ? (
          <p className="click-actions__empty">{emptyHint}</p>
        ) : (
          <>
            <p className="click-actions__history-label">{historyLabel}</p>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                viewerRole={viewerRole}
                currentUserId={currentUserId}
                onAcceptOffer={onAcceptOffer}
                onDeclineOffer={onDeclineOffer}
                respondingOfferId={respondingOfferId}
              />
            ))}
          </>
        )}
        <div ref={historyEndRef} />
      </div>

      {actions.length > 0 && (
        <div className="click-actions__panel">
          <p className="click-actions__panel-label">{actionsLabel}</p>
          <div className="click-actions__grid">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="click-actions__btn"
                disabled={disabled || sending}
                aria-busy={sending && sentActionId === action.id}
                onClick={() => onAction(action)}
              >
                {sending && sentActionId === action.id ? 'იგზავნება...' : action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ClickActionsPanel
