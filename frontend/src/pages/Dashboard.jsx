import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, LogOut, MousePointerClick, Plus, Shield, Trash2, Users, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import DeveloperRequestsPanel from '../components/admin/DeveloperRequestsPanel'
import ClickActionsPanel from '../components/ClickActionsPanel'
import DigitMark from '../components/DigitMark'
import InternalChatsPanel from '../components/internal/InternalChatsPanel'
import CreateOrderModal from '../components/orders/CreateOrderModal'
import PriceOfferModal from '../components/PriceOfferModal'
import ManagerOrdersPanel from '../components/orders/ManagerOrdersPanel'
import { useInternalChatUnreadCount } from '../hooks/useInternalChatUnread'
import {
  closeConversation,
  deleteConversation,
  formatRelativeTime,
  sendStaffMessage,
  sendPriceOffer,
  subscribeToConversations,
  subscribeToMessages,
} from '../services/chatService'
import { getServiceById } from '../data/services'
import { MANAGER_REPLY_ACTIONS } from '../constants/clickActions'
import { isManagerOrAdminRole, getStaffConversationType } from '../utils/roles'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle } from '../constants/brand'
import './Dashboard.css'
import './Admin.css'

const EMPTY_ARRAY = []

const ROLE_LABELS = {
  manager: 'მენეჯერის პანელი',
}

const MANAGER_TAB_PATHS = {
  admin: '/dashboard',
  chats: '/dashboard/chats',
  internal: '/dashboard/internal',
  orders: '/dashboard/orders',
}

function Dashboard({ initialTab = 'admin' }) {
  usePageMeta(
    initialTab === 'admin' ? pageTitle('ადმინისტრაცია') : pageTitle('Dashboard'),
    'DIGIT — მენეჯერის პანელი.',
  )

  const navigate = useNavigate()
  const { user, userProfile, logout } = useAuth()
  const role = userProfile?.role
  const staffType = getStaffConversationType(role)
  const canManage = isManagerOrAdminRole(role)

  const [mainTab, setMainTab] = useState(initialTab)
  const [statusFilter, setStatusFilter] = useState('open')
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadedId, setLoadedId] = useState(null)
  const [sendingAction, setSendingAction] = useState(false)
  const [sentActionId, setSentActionId] = useState(null)
  const [closing, setClosing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [error, setError] = useState('')
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [showPriceOffer, setShowPriceOffer] = useState(false)
  const [sendingPriceOffer, setSendingPriceOffer] = useState(false)
  const [focusOrderId, setFocusOrderId] = useState(null)
  const internalUnread = useInternalChatUnreadCount(user?.uid, userProfile?.role)

  const selectedConversation = conversations.find((c) => c.id === selectedId)

  const displayMessages = selectedId && loadedId === selectedId ? messages : EMPTY_ARRAY
  const loadingMessages = !!selectedId && loadedId !== selectedId

  const handleError = useCallback((message) => {
    setError(message)
  }, [])

  const handleStatusFilterChange = (filter) => {
    setStatusFilter(filter)
    setLoadingList(true)
    setError('')
  }

  useEffect(() => {
    if (!role) return undefined

    const unsubscribe = subscribeToConversations(
      staffType,
      statusFilter,
      (list) => {
        setConversations(list)
        setLoadingList(false)
        setError('')
        setSelectedId((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev
          return list[0]?.id ?? null
        })
      },
      (err) => {
        console.error('Conversations subscription error:', err)
        setError('საუბრების ჩატვირთვა ვერ მოხერხდა.')
        setLoadingList(false)
      },
    )

    return unsubscribe
  }, [staffType, statusFilter])

  useEffect(() => {
    if (!selectedId) {
      return undefined
    }

    const unsubscribe = subscribeToMessages(
      selectedId,
      (list) => {
        setMessages(list)
        setLoadedId(selectedId)
      },
      (err) => {
        console.error('Messages subscription error:', err)
        setError('მესიჯების ჩატვირთვა ვერ მოხერხდა.')
        setLoadedId(selectedId)
      },
    )

    return unsubscribe
  }, [selectedId])

  const handleAction = async (action) => {
    if (!selectedId || !user || !role || sendingAction || selectedConversation?.status !== 'open') {
      return
    }

    setSendingAction(true)
    setSentActionId(action.id)
    setError('')

    try {
      await sendStaffMessage(selectedId, {
        senderId: user.uid,
        senderRole: staffType,
        text: action.message,
      })
    } catch (err) {
      console.error('Action error:', err)
      setError('მოქმედების გაგზავნა ვერ მოხერხდა.')
    } finally {
      setSendingAction(false)
      setSentActionId(null)
    }
  }

  const handlePriceOfferSubmit = async ({ price, description }) => {
    if (!selectedId || !user || !role || sendingPriceOffer) return

    setSendingPriceOffer(true)
    setError('')

    try {
      await sendPriceOffer(selectedId, {
        senderId: user.uid,
        senderRole: staffType,
        price,
        description,
        serviceType:
          getServiceById(selectedConversation.serviceRequested)?.title || '',
      })
      setShowPriceOffer(false)
    } catch (err) {
      console.error('Price offer error:', err)
      setError('ფასის შეთავაზების გაგზავნა ვერ მოხერხდა.')
      throw err
    } finally {
      setSendingPriceOffer(false)
    }
  }

  const handleClose = async () => {
    if (!selectedId || closing || selectedConversation?.status === 'closed') return

    setClosing(true)
    setError('')

    try {
      await closeConversation(selectedId)
      setSelectedId(null)
    } catch (err) {
      console.error('Close error:', err)
      setError('საუბრის დახურვა ვერ მოხერხდა.')
    } finally {
      setClosing(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return

    setDeleting(true)
    setError('')

    try {
      await deleteConversation(deleteTarget)
      if (selectedId === deleteTarget) {
        setSelectedId(null)
      }
      setDeleteTarget(null)
    } catch (err) {
      console.error('Delete error:', err)
      setError('საუბრის წაშლა ვერ მოხერხდა.')
    } finally {
      setDeleting(false)
    }
  }

  const handleOrderCreated = (orderId) => {
    setFocusOrderId(orderId)
    navigate(MANAGER_TAB_PATHS.orders)
    setMainTab('orders')
  }

  const handleManagerTabChange = (tab) => {
    setMainTab(tab)
    setError('')
    navigate(MANAGER_TAB_PATHS[tab] ?? MANAGER_TAB_PATHS.admin)
  }

  const handleLogout = async () => {
    await logout()
  }

  const isAdminView = canManage && mainTab === 'admin'

  return (
    <div className={`dashboard ${isAdminView ? 'dashboard--admin' : ''}`}>
      <header className={`dashboard-header ${isAdminView ? 'admin-shell__header' : ''}`}>
        <div className="dashboard-header__brand">
          {isAdminView && <DigitMark size="sm" />}
          <span className={`dashboard-header__badge ${isAdminView ? 'admin-shell__header-badge' : ''}`}>
            Admin
          </span>
          <h1 className="dashboard-header__title">
            {isAdminView ? 'ადმინისტრაცია' : ROLE_LABELS[role] ?? 'Dashboard'}
          </h1>
        </div>
        <div className="dashboard-header__actions">
          {canManage && (
            <div className="dashboard-main-tabs">
              <button
                type="button"
                className={`dashboard-main-tab ${mainTab === 'admin' ? 'dashboard-main-tab--active' : ''}`}
                onClick={() => handleManagerTabChange('admin')}
              >
                <Shield size={16} />
                ადმინისტრაცია
              </button>
              <button
                type="button"
                className={`dashboard-main-tab ${mainTab === 'chats' ? 'dashboard-main-tab--active' : ''}`}
                onClick={() => handleManagerTabChange('chats')}
              >
                <MousePointerClick size={16} />
                მომხმარებლის მოთხოვნები
              </button>
              <button
                type="button"
                className={`dashboard-main-tab ${mainTab === 'internal' ? 'dashboard-main-tab--active' : ''}`}
                onClick={() => handleManagerTabChange('internal')}
              >
                <Users size={16} />
                შინაგანი მოქმედებები
                {internalUnread > 0 && (
                  <span className="dashboard-main-tab__badge">{internalUnread}</span>
                )}
              </button>
              <button
                type="button"
                className={`dashboard-main-tab ${mainTab === 'orders' ? 'dashboard-main-tab--active' : ''}`}
                onClick={() => handleManagerTabChange('orders')}
              >
                <ClipboardList size={16} />
                შეკვეთები
              </button>
            </div>
          )}
          <button type="button" className="dashboard-header__link" onClick={handleLogout}>
            <LogOut size={18} />
            გასვლა
          </button>
        </div>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      {canManage && mainTab === 'admin' ? (
        <DeveloperRequestsPanel />
      ) : canManage && mainTab === 'orders' ? (
        <ManagerOrdersPanel
          managerName={userProfile?.name || user?.email || 'მენეჯერი'}
          initialOrderId={focusOrderId}
          onError={handleError}
        />
      ) : canManage && mainTab === 'internal' ? (
        <div className="dashboard-internal">
          <InternalChatsPanel
            user={user}
            userProfile={userProfile}
            onError={handleError}
          />
        </div>
      ) : (
        <div className="dashboard-body">
          <aside className="dashboard-sidebar">
            <div className="dashboard-filters">
              <button
                type="button"
                className={`dashboard-filter ${statusFilter === 'open' ? 'dashboard-filter--active' : ''}`}
                onClick={() => handleStatusFilterChange('open')}
              >
                ღია მოთხოვნები
              </button>
              <button
                type="button"
                className={`dashboard-filter ${statusFilter === 'closed' ? 'dashboard-filter--active' : ''}`}
                onClick={() => handleStatusFilterChange('closed')}
              >
                დახურული მოთხოვნები
              </button>
            </div>

            <div className="dashboard-list">
              {loadingList ? (
                <p className="dashboard-list__empty">იტვირთება...</p>
              ) : conversations.length === 0 ? (
                <p className="dashboard-list__empty">
                  {statusFilter === 'open' ? 'ღია მოთხოვნები არ არის.' : 'დახურული მოთხოვნები არ არის.'}
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    className={`dashboard-conv ${selectedId === conv.id ? 'dashboard-conv--active' : ''}`}
                    onClick={() => {
                      setSelectedId(conv.id)
                      setError('')
                    }}
                  >
                    <div className="dashboard-conv__top">
                      <span className="dashboard-conv__name">{conv.customerName}</span>
                      <span className={`dashboard-conv__status dashboard-conv__status--${conv.status}`}>
                        {conv.status === 'open' ? 'ღია' : 'დახურული'}
                      </span>
                    </div>
                    <p className="dashboard-conv__preview">
                      {conv.lastMessageText || 'მოქმედებები არ არის'}
                    </p>
                    <span className="dashboard-conv__time">
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <main className="dashboard-chat">
            {!selectedId ? (
              <div className="dashboard-chat__placeholder">
                <p>აირჩიეთ მოთხოვნა სიიდან</p>
              </div>
            ) : (
              <>
                <div className="dashboard-chat__header">
                  <div>
                    <h2 className="dashboard-chat__title">{selectedConversation?.customerName}</h2>
                    {selectedConversation?.serviceRequested && (
                      <p className="dashboard-chat__meta">
                        სერვისი:{' '}
                        {getServiceById(selectedConversation.serviceRequested)?.title ??
                          selectedConversation.serviceRequested}
                      </p>
                    )}
                  </div>
                  <div className="dashboard-chat__header-actions">
                    {canManage && selectedConversation?.status === 'open' && (
                      <>
                        <button
                          type="button"
                          className="dashboard-chat__order-btn"
                          onClick={() => setShowPriceOffer(true)}
                        >
                          ფასის შეთავაზება
                        </button>
                        <button
                          type="button"
                          className="dashboard-chat__order-btn"
                          onClick={() => setShowCreateOrder(true)}
                        >
                          <Plus size={18} />
                          შეკვეთის შექმნა
                        </button>
                      </>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        className="dashboard-chat__delete-btn"
                        onClick={() => setDeleteTarget(selectedId)}
                        disabled={deleting || closing}
                      >
                        <Trash2 size={18} />
                        წაშლა
                      </button>
                    )}
                    {selectedConversation?.status === 'open' && (
                      <button
                        type="button"
                        className="dashboard-chat__close-btn"
                        onClick={handleClose}
                        disabled={closing}
                      >
                        <XCircle size={18} />
                        {closing ? 'იხურება...' : 'დახურვა'}
                      </button>
                    )}
                  </div>
                </div>

                {selectedConversation?.status === 'open' ? (
                  <ClickActionsPanel
                    actions={MANAGER_REPLY_ACTIONS}
                    messages={displayMessages}
                    loading={loadingMessages}
                    sending={sendingAction}
                    sentActionId={sentActionId}
                    onAction={handleAction}
                    emptyHint="მომხმარებელმა ჯერ არ აირჩია მოქმედება."
                    actionsLabel="პასუხის მოქმედება"
                    viewerRole="staff"
                  />
                ) : (
                  <div className="dashboard-chat__closed-wrap">
                    <ClickActionsPanel
                      actions={[]}
                      messages={displayMessages}
                      loading={loadingMessages}
                      disabled
                      emptyHint="მოქმედებების ისტორია ცარიელია."
                      viewerRole="staff"
                    />
                    <div className="dashboard-chat__closed-notice">
                      ეს მოთხოვნა დახურულია.
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}

      {showPriceOffer && selectedConversation && (
        <PriceOfferModal
          onClose={() => !sendingPriceOffer && setShowPriceOffer(false)}
          onSubmit={handlePriceOfferSubmit}
          submitting={sendingPriceOffer}
        />
      )}

      {showCreateOrder && selectedConversation && (
        <CreateOrderModal
          conversation={selectedConversation}
          onClose={() => setShowCreateOrder(false)}
          onCreated={handleOrderCreated}
        />
      )}

      {deleteTarget && (
        <div className="admin-dialog-backdrop" role="presentation" onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            className="admin-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-dialog__title">მოთხოვნის წაშლა</h2>
            <p className="admin-dialog__text">
              დარწმუნებული ხარ? მოთხოვნა და მისი ისტორია სამუდამოდ წაიშლება.
            </p>
            <div className="admin-dialog__actions">
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                გაუქმება
              </button>
              <button
                type="button"
                className="btn btn--primary btn--sm dashboard-chat__delete-btn"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'იშლება...' : 'წაშლა'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
