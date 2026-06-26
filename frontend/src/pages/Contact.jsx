import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Phone, Mail, Clock, User, Code2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ClickActionsPanel from '../components/ClickActionsPanel'
import FirebaseSetupNotice from '../components/FirebaseSetupNotice'
import Reveal from '../components/Reveal'
import usePageMeta from '../hooks/usePageMeta'
import { CONTACT_EMAIL, pageTitle } from '../constants/brand'
import { getServiceById } from '../data/services'
import {
  CUSTOMER_DEVELOPER_ACTIONS,
  CUSTOMER_MANAGER_ACTIONS,
} from '../constants/clickActions'
import {
  acceptPriceOffer,
  declinePriceOffer,
  findOrCreateOpenConversation,
  getMessageType,
  MESSAGE_TYPE,
  sendCustomerMessage,
  sendServiceRequestMessage,
  subscribeToMessages,
} from '../services/chatService'
import './Contact.css'

const EMPTY_ARRAY = []

const TABS = {
  manager: {
    id: 'manager',
    label: 'მენეჯერთან',
    icon: User,
    name: 'გიორგი — მენეჯერი',
    actions: CUSTOMER_MANAGER_ACTIONS,
    emptyHint: 'აირჩიეთ მოქმედება — მენეჯერი მალე გიპასუხებთ.',
  },
  developer: {
    id: 'developer',
    label: 'დეველოპერთან',
    icon: Code2,
    name: 'ნიკა — დეველოპერი',
    actions: CUSTOMER_DEVELOPER_ACTIONS,
    emptyHint: 'აირჩიეთ მოქმედება — დეველოპერი მალე გიპასუხებთ.',
  },
}

function Contact() {
  usePageMeta(
    pageTitle('დაკავშირება'),
    'DIGIT — დაუკავშირდით მენეჯერს ერთი კლიკით, ან ელ. ფოსტით და ტელეფონით.',
  )

  const { user, userProfile, isFirebaseConfigured } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const serviceId = searchParams.get('service')
  const autoRequest = searchParams.get('autoRequest') === '1'
  const selectedService = serviceId ? getServiceById(serviceId) : null

  const [activeTab, setActiveTab] = useState('manager')
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadedChatKey, setLoadedChatKey] = useState('')
  const [sending, setSending] = useState(false)
  const [sentActionId, setSentActionId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [respondingOfferId, setRespondingOfferId] = useState(null)
  const autoRequestSentRef = useRef(false)

  const tab = TABS[activeTab]
  const customerName = useMemo(
    () =>
      userProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'მომხმარებელი',
    [userProfile?.name, user?.displayName, user?.email],
  )

  const currentChatKey = user ? `${user.uid}_${activeTab}_${serviceId || ''}` : ''
  const displayConversationId = loadedChatKey === currentChatKey ? conversationId : null
  const displayMessages = loadedChatKey === currentChatKey ? messages : EMPTY_ARRAY
  const loadingActions = !!user && isFirebaseConfigured && loadedChatKey !== currentChatKey

  const waitingForManager = useMemo(() => {
    if (activeTab !== 'manager') return false
    const hasServiceRequest = displayMessages.some(
      (m) => getMessageType(m) === MESSAGE_TYPE.SERVICE_REQUEST,
    )
    if (!hasServiceRequest) return false
    return !displayMessages.some(
      (m) =>
        getMessageType(m) === MESSAGE_TYPE.PRICE_OFFER ||
        (getMessageType(m) === MESSAGE_TYPE.TEXT && m.senderRole === 'manager'),
    )
  }, [displayMessages, activeTab])

  useEffect(() => {
    autoRequestSentRef.current = false
  }, [currentChatKey])

  useEffect(() => {
    if (!user || !isFirebaseConfigured) return undefined

    let unsubscribeMessages = () => {}
    let cancelled = false

    async function initConversation() {
      try {
        const convId = await findOrCreateOpenConversation({
          customerId: user.uid,
          customerName,
          type: activeTab,
          serviceRequested: serviceId,
        })

        if (cancelled) return

        setConversationId(convId)

        unsubscribeMessages = subscribeToMessages(
          convId,
          (firestoreMessages) => {
            if (cancelled) return
            setMessages(firestoreMessages)
            setLoadedChatKey(currentChatKey)
          },
          () => {
            if (!cancelled) {
              setActionError('მოთხოვნების ჩატვირთვა ვერ მოხერხდა.')
              setLoadedChatKey(currentChatKey)
            }
          },
        )
      } catch {
        if (!cancelled) {
          setActionError('მოთხოვნის გაგზავნა ვერ მოხერხდა.')
          setLoadedChatKey(currentChatKey)
        }
      }
    }

    initConversation()

    return () => {
      cancelled = true
      unsubscribeMessages()
    }
  }, [user, customerName, activeTab, serviceId, isFirebaseConfigured, currentChatKey])

  useEffect(() => {
    if (
      !autoRequest ||
      !selectedService ||
      !displayConversationId ||
      !user ||
      activeTab !== 'manager' ||
      loadingActions ||
      autoRequestSentRef.current
    ) {
      return
    }

    const alreadySent = displayMessages.some(
      (m) =>
        getMessageType(m) === MESSAGE_TYPE.SERVICE_REQUEST &&
        m.serviceType === selectedService.title,
    )

    if (alreadySent) {
      autoRequestSentRef.current = true
      return
    }

    autoRequestSentRef.current = true

    const text = `მომხმარებელმა მოითხოვა: ${selectedService.title}`

    sendServiceRequestMessage(displayConversationId, {
      senderId: user.uid,
      serviceType: selectedService.title,
      text,
    }).catch(() => {
      autoRequestSentRef.current = false
      setActionError('სერვისის მოთხოვნის გაგზავნა ვერ მოხერხდა.')
    })
  }, [
    autoRequest,
    selectedService,
    displayConversationId,
    user,
    activeTab,
    loadingActions,
    displayMessages,
  ])

  useEffect(() => {
    if (!autoRequest || !serviceId || loadedChatKey !== currentChatKey) return

    const next = new URLSearchParams(searchParams)
    if (!next.has('autoRequest')) return

    next.delete('autoRequest')
    setSearchParams(next, { replace: true })
  }, [autoRequest, serviceId, loadedChatKey, currentChatKey, searchParams, setSearchParams])

  const handleAction = async (action) => {
    if (!displayConversationId || !user || sending) return

    setActionError('')
    setSending(true)
    setSentActionId(action.id)

    const message =
      selectedService && action.id === 'request-service'
        ? `${action.message} (სერვისი: ${selectedService.title})`
        : action.message

    try {
      await sendCustomerMessage(displayConversationId, {
        senderId: user.uid,
        text: message,
      })
    } catch {
      setActionError('მოქმედების გაგზავნა ვერ მოხერხდა.')
    } finally {
      setSending(false)
      setSentActionId(null)
    }
  }

  const handleAcceptOffer = async (messageId) => {
    if (!displayConversationId || !user || respondingOfferId) return

    setRespondingOfferId(messageId)
    setActionError('')

    try {
      await acceptPriceOffer(displayConversationId, messageId, {
        customerId: user.uid,
        customerName,
        serviceType: selectedService?.title || undefined,
      })
    } catch (err) {
      if (err.message !== 'ALREADY_RESPONDED') {
        setActionError('შეთავაზების მიღება ვერ მოხერხდა.')
      }
    } finally {
      setRespondingOfferId(null)
    }
  }

  const handleDeclineOffer = async (messageId, reason = '') => {
    if (!displayConversationId || respondingOfferId) return

    setRespondingOfferId(messageId)
    setActionError('')

    try {
      await declinePriceOffer(displayConversationId, messageId, reason)
    } catch (err) {
      if (err.message !== 'ALREADY_RESPONDED') {
        setActionError('შეთავაზების უარყოფა ვერ მოხერხდა.')
      }
    } finally {
      setRespondingOfferId(null)
    }
  }

  const handleTabChange = (tabId) => {
    if (tabId === activeTab || sending) return
    setActiveTab(tabId)
    setConversationId(null)
    setMessages([])
    setLoadedChatKey('')
    setActionError('')
  }

  const emptyHint = selectedService
    ? `${tab.emptyHint} (სერვისი: ${selectedService.title})`
    : tab.emptyHint

  const chatStatus = waitingForManager
    ? 'მენეჯერს ეცნობა, ელოდები პასუხს...'
    : 'აირჩიეთ მოქმედება'

  return (
    <>
      <section className="page-hero page-hero--compact">
        <div className="container">
          <Reveal variant="fade">
            <span className="relay-line" />
            <h1 className="page__title">დაკავშირება</h1>
            <p className="page__subtitle">
              აირჩიეთ მოქმედება ერთი კლიკით — DIGIT მენეჯერი პროცესს ხელში აიღებს.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="page contact-page">
        <div className="container">
          {actionError && <div className="contact-page__error">{actionError}</div>}
          {!isFirebaseConfigured && (
            <div className="container" style={{ marginBottom: '1rem' }}>
              <FirebaseSetupNotice />
            </div>
          )}

          <div className="contact-layout">
            <aside className="contact-sidebar">
              <div className="contact-tabs" role="tablist" aria-label="კონტაქტის არჩევანი">
                {Object.values(TABS).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === id}
                    className={`contact-tab ${activeTab === id ? 'contact-tab--active' : ''}`}
                    onClick={() => handleTabChange(id)}
                    disabled={sending || loadingActions}
                  >
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <div className="contact-info">
                <h2 className="contact-info__title">სხვა გზით დაკავშირება</h2>
                <p className="contact-info__desc">პირდაპირი კონტაქტი:</p>
                <ul className="contact-info__list">
                  <li>
                    <Phone size={18} aria-hidden="true" />
                    <div>
                      <span className="contact-info__label">ტელეფონი</span>
                      <a href="tel:+995555123456">+995 555 123 456</a>
                    </div>
                  </li>
                  <li>
                    <Mail size={18} aria-hidden="true" />
                    <div>
                      <span className="contact-info__label">ელ. ფოსტა</span>
                      <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                    </div>
                  </li>
                  <li>
                    <Clock size={18} aria-hidden="true" />
                    <div>
                      <span className="contact-info__label">სამუშაო საათები</span>
                      <span>ორშ–პარ, 10:00 – 19:00</span>
                    </div>
                  </li>
                </ul>
                <Link to="/my-orders" className="btn btn--outline contact-info__orders-link">
                  ჩემი შეკვეთები
                </Link>
              </div>
            </aside>

            <div className="chat-window contact-actions-window" role="tabpanel">
              <div className="chat-window__header">
                <div className="chat-window__avatar" aria-hidden="true">
                  {activeTab === 'manager' ? 'GM' : 'NK'}
                </div>
                <div>
                  <h2 className="chat-window__name">{tab.name}</h2>
                  <span
                    className={`chat-window__status ${waitingForManager ? 'chat-window__status--waiting' : ''}`}
                  >
                    {chatStatus}
                  </span>
                </div>
              </div>

              {waitingForManager && (
                <div className="contact-waiting-banner" role="status">
                  მენეჯერს ეცნობა, ელოდები პასუხს
                </div>
              )}

              <ClickActionsPanel
                actions={tab.actions}
                messages={displayMessages}
                loading={loadingActions}
                disabled={!displayConversationId || !isFirebaseConfigured}
                sending={sending}
                sentActionId={sentActionId}
                onAction={handleAction}
                emptyHint={emptyHint}
                actionsLabel="რა გჭირდებათ?"
                viewerRole="customer"
                currentUserId={user?.uid}
                onAcceptOffer={handleAcceptOffer}
                onDeclineOffer={handleDeclineOffer}
                respondingOfferId={respondingOfferId}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Contact
