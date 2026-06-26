import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Search, Trash2, Users } from 'lucide-react'
import ClickActionsPanel from '../ClickActionsPanel'
import { INTERNAL_STAFF_ACTIONS } from '../../constants/clickActions'
import {
  STAFF_ROLE_LABELS,
  deleteInternalChat,
  findOrCreateInternalChat,
  formatRelativeTime,
  getOtherParticipant,
  isInternalChatUnread,
  markInternalChatAsRead,
  sendInternalMessage,
  subscribeToInternalChats,
  subscribeToInternalMessages,
  subscribeToStaffMembers,
} from '../../services/internalChatService'
import { isStaffRole } from '../../utils/roles'
import './InternalChatsPanel.css'

const EMPTY_ARRAY = []

function InternalChatsPanel({ user, userProfile, onError }) {
  const [sidebarMode, setSidebarMode] = useState('inbox')
  const [staffMembers, setStaffMembers] = useState([])
  const [chats, setChats] = useState([])
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadedChatId, setLoadedChatId] = useState(null)
  const [staffSearch, setStaffSearch] = useState('')
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [loadingChats, setLoadingChats] = useState(true)
  const [sending, setSending] = useState(false)
  const [sentActionId, setSentActionId] = useState(null)
  const [startingChat, setStartingChat] = useState(false)
  const [pendingTarget, setPendingTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const currentUserId = user?.uid
  const currentUserName = userProfile?.name || user?.email || 'თანამშრომელი'
  const currentUserRole = userProfile?.role
  const canUseInternalChat = Boolean(currentUserId && isStaffRole(currentUserRole))

  const selectedChat = chats.find((chat) => chat.id === selectedChatId)
  const otherParticipant = selectedChat ? getOtherParticipant(selectedChat, currentUserId) : null
  const activeParticipant = otherParticipant || pendingTarget
  const showChat = Boolean(selectedChatId && activeParticipant)

  const displayMessages =
    selectedChatId && loadedChatId === selectedChatId ? messages : EMPTY_ARRAY

  const loadingMessages = Boolean(selectedChatId && loadedChatId !== selectedChatId)

  const unreadCount = useMemo(
    () => chats.filter((chat) => isInternalChatUnread(chat, currentUserId)).length,
    [chats, currentUserId],
  )

  const resolvedSidebarMode = useMemo(() => {
    if (
      canUseInternalChat &&
      !loadingChats &&
      chats.length === 0 &&
      !selectedChatId &&
      !pendingTarget
    ) {
      return 'staff'
    }
    return sidebarMode
  }, [
    canUseInternalChat,
    loadingChats,
    chats.length,
    selectedChatId,
    pendingTarget,
    sidebarMode,
  ])

  const chatByOtherId = useMemo(() => {
    const map = new Map()
    chats.forEach((chat) => {
      const other = getOtherParticipant(chat, currentUserId)
      if (other?.uid) map.set(other.uid, chat)
    })
    return map
  }, [chats, currentUserId])

  const filteredStaff = useMemo(() => {
    const queryText = staffSearch.trim().toLowerCase()
    if (!queryText) return staffMembers
    return staffMembers.filter((member) => {
      const name = (member.name || member.email || '').toLowerCase()
      const roleLabel = (STAFF_ROLE_LABELS[member.role] || '').toLowerCase()
      return name.includes(queryText) || roleLabel.includes(queryText)
    })
  }, [staffMembers, staffSearch])

  useEffect(() => {
    if (!canUseInternalChat) return undefined

    const unsubscribe = subscribeToStaffMembers(
      currentUserId,
      (list) => {
        setStaffMembers(list)
        setLoadingStaff(false)
        onError?.('')
      },
      (err) => {
        onError?.(err.message || 'თანამშრომლების ჩატვირთვა ვერ მოხერხდა.')
        setLoadingStaff(false)
      },
    )

    return unsubscribe
  }, [canUseInternalChat, currentUserId, onError])

  useEffect(() => {
    if (!canUseInternalChat) return undefined

    const unsubscribe = subscribeToInternalChats(
      currentUserId,
      (list) => {
        setChats(list)
        setLoadingChats(false)
        onError?.('')
        setSelectedChatId((prev) => {
          if (!prev) return prev
          return list.some((chat) => chat.id === prev) ? prev : null
        })
        setPendingTarget((target) => {
          if (!target) return null
          const hasChat = list.some((chat) => {
            const other = getOtherParticipant(chat, currentUserId)
            return other?.uid === target.uid
          })
          return hasChat ? null : target
        })
      },
      (err) => {
        onError?.(err.message || 'შინაგანი საუბრების ჩატვირთვა ვერ მოხერხდა.')
        setLoadingChats(false)
      },
    )

    return unsubscribe
  }, [canUseInternalChat, currentUserId, onError])

  useEffect(() => {
    if (!selectedChatId) return undefined

    const unsubscribe = subscribeToInternalMessages(
      selectedChatId,
      (list) => {
        setMessages(list)
        setLoadedChatId(selectedChatId)
      },
      (err) => {
        onError?.(err.message || 'მესიჯების ჩატვირთვა ვერ მოხერხდა.')
        setLoadedChatId(selectedChatId)
      },
    )

    return unsubscribe
  }, [selectedChatId, onError])

  useEffect(() => {
    if (!selectedChatId || !currentUserId) return
    markInternalChatAsRead(selectedChatId, currentUserId).catch(() => {})
  }, [selectedChatId, currentUserId, messages.length])

  const handleSelectChat = (chatId) => {
    setPendingTarget(null)
    setSelectedChatId(chatId)
    setSidebarMode('inbox')
  }

  const handleOpenStaffTab = () => {
    setSidebarMode('staff')
  }

  const handleStartChat = async (member) => {
    if (!currentUserId || !currentUserRole || !isStaffRole(currentUserRole) || startingChat) return

    setStartingChat(true)
    onError?.('')

    try {
      const chatId = await findOrCreateInternalChat({
        currentUserId,
        currentUserName,
        currentUserRole,
        otherUserId: member.uid,
        otherUserName: member.name || member.email || 'თანამშრომელი',
        otherUserRole: member.role,
      })
      setPendingTarget({
        uid: member.uid,
        name: member.name || member.email || 'თანამშრომელი',
        role: member.role,
      })
      setSelectedChatId(chatId)
      setSidebarMode('inbox')
    } catch (err) {
      onError?.(err.message || 'საუბრის დაწყება ვერ მოხერხდა.')
    } finally {
      setStartingChat(false)
    }
  }

  const handleAction = async (action) => {
    if (!selectedChatId || !currentUserId || sending) return

    setSending(true)
    setSentActionId(action.id)
    onError?.('')

    try {
      await sendInternalMessage(selectedChatId, {
        senderId: currentUserId,
        senderName: currentUserName,
        text: action.message,
      })
    } catch (err) {
      onError?.(err.message || 'მოქმედების გაგზავნა ვერ მოხერხდა.')
    } finally {
      setSending(false)
      setSentActionId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return

    setDeleting(true)
    onError?.('')

    try {
      await deleteInternalChat(deleteTarget)
      if (selectedChatId === deleteTarget) {
        setSelectedChatId(null)
        setPendingTarget(null)
      }
      setDeleteTarget(null)
    } catch (err) {
      onError?.(err.message || 'საუბრის წაშლა ვერ მოხერხდა.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="internal-chats">
      <aside className="internal-chats__sidebar">
        <div className="internal-chats__intro">
          <span className="internal-chats__intro-badge">შინაგანი</span>
          <p>თანამშრომლებს შორის სწრაფი მოქმედებები — მომხმარებლის მოთხოვნებისგან ცალკე.</p>
        </div>

        <div className="dashboard-filters internal-chats__filters">
          <button
            type="button"
            className={`dashboard-filter ${resolvedSidebarMode === 'inbox' ? 'dashboard-filter--active' : ''}`}
            onClick={() => setSidebarMode('inbox')}
          >
            აქტიური კავშირები
            {unreadCount > 0 && (
              <span className="internal-chats__badge">{unreadCount}</span>
            )}
          </button>
          <button
            type="button"
            className={`dashboard-filter ${resolvedSidebarMode === 'staff' ? 'dashboard-filter--active' : ''}`}
            onClick={() => setSidebarMode('staff')}
          >
            <Users size={14} />
            თანამშრომლები
          </button>
        </div>

        {resolvedSidebarMode === 'staff' && (
          <div className="internal-chats__search">
            <Search size={16} className="internal-chats__search-icon" />
            <input
              type="search"
              className="internal-chats__search-field"
              placeholder="სახელი ან როლი..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
            />
          </div>
        )}

        <div className="internal-chats__list">
          {resolvedSidebarMode === 'inbox' ? (
            loadingChats ? (
              <p className="dashboard-list__empty">იტვირთება...</p>
            ) : chats.length === 0 ? (
              <div className="internal-chats__empty-sidebar">
                <p className="dashboard-list__empty">
                  აქტიური შინაგანი საუბრები არ არის.
                </p>
                <button
                  type="button"
                  className="btn btn--outline btn--sm internal-chats__empty-btn"
                  onClick={handleOpenStaffTab}
                >
                  <Users size={16} />
                  თანამშრომლის არჩევა
                </button>
              </div>
            ) : (
              chats.map((chat) => {
                const other = getOtherParticipant(chat, currentUserId)
                const unread = isInternalChatUnread(chat, currentUserId)
                return (
                  <button
                    key={chat.id}
                    type="button"
                    className={`internal-chats__item ${selectedChatId === chat.id ? 'internal-chats__item--active' : ''}`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="internal-chats__item-top">
                      <span className="internal-chats__item-name">{other?.name}</span>
                      {unread && <span className="internal-chats__unread-dot" aria-label="წაუკითხავი" />}
                      <span className={`internal-chats__role-badge internal-chats__role-badge--${other?.role}`}>
                        {STAFF_ROLE_LABELS[other?.role] ?? other?.role}
                      </span>
                    </div>
                    <p className="internal-chats__item-preview">
                      {chat.lastMessageText || 'მოქმედებები არ არის'}
                    </p>
                    <span className="internal-chats__item-time">
                      {formatRelativeTime(chat.lastMessageAt)}
                    </span>
                  </button>
                )
              })
            )
          ) : loadingStaff ? (
            <p className="dashboard-list__empty">იტვირთება...</p>
          ) : filteredStaff.length === 0 ? (
            <p className="dashboard-list__empty">
              {staffSearch.trim() ? 'შედეგი ვერ მოიძებნა.' : 'სხვა თანამშრომელი არ არის.'}
            </p>
          ) : (
            filteredStaff.map((member) => {
              const existingChat = chatByOtherId.get(member.uid)
              const unread = existingChat
                ? isInternalChatUnread(existingChat, currentUserId)
                : false
              return (
                <button
                  key={member.uid}
                  type="button"
                  className="internal-chats__staff-item"
                  onClick={() => handleStartChat(member)}
                  disabled={startingChat}
                >
                  <div className="internal-chats__item-top">
                    <span className="internal-chats__item-name">
                      {member.name || member.email}
                    </span>
                    {unread && <span className="internal-chats__unread-dot" aria-label="წაუკითხავი" />}
                    <span className={`internal-chats__role-badge internal-chats__role-badge--${member.role}`}>
                      {STAFF_ROLE_LABELS[member.role] ?? member.role}
                    </span>
                  </div>
                  <span className="internal-chats__staff-action">
                    {existingChat ? 'საუბრის გახსნა' : 'ახალი საუბრის დაწყება'}
                  </span>
                </button>
              )
            })
          )}
        </div>
      </aside>

      <main className="internal-chats__main dashboard-chat">
        {!showChat ? (
          <div className="internal-chats__empty-main">
            <div className="internal-chats__empty-icon" aria-hidden="true">
              <MessageSquare size={40} />
            </div>
            <h2 className="internal-chats__empty-title">შინაგანი მოქმედებები</h2>
            <p className="internal-chats__empty-text">
              {chats.length === 0
                ? 'აირჩიე თანამშრომელი მარცხენა სიიდან და გაგზავნე მოქმედება.'
                : 'აირჩიე აქტიური კავშირი სიიდან ან დაიწყე ახალი თანამშრომელთან.'}
            </p>
            <button
              type="button"
              className="btn btn--primary internal-chats__empty-cta"
              onClick={handleOpenStaffTab}
            >
              <Users size={18} />
              {chats.length === 0 ? 'თანამშრომლის არჩევა' : 'ახალი კავშირი'}
            </button>
          </div>
        ) : (
          <>
            <div className="dashboard-chat__header internal-chats__header">
              <div>
                <span className="internal-chats__header-label">შინაგანი მოქმედება</span>
                <h2 className="dashboard-chat__title">{activeParticipant.name}</h2>
                <p className="dashboard-chat__meta">
                  {STAFF_ROLE_LABELS[activeParticipant.role] ?? activeParticipant.role}
                </p>
              </div>
              <button
                type="button"
                className="dashboard-chat__delete-btn"
                onClick={() => setDeleteTarget(selectedChatId)}
                disabled={deleting}
              >
                <Trash2 size={18} />
                წაშლა
              </button>
            </div>

            <ClickActionsPanel
              actions={INTERNAL_STAFF_ACTIONS}
              messages={displayMessages}
              loading={loadingMessages}
              sending={sending}
              sentActionId={sentActionId}
              onAction={handleAction}
              emptyHint="აირჩიეთ მოქმედება თანამშრომელთან."
              actionsLabel="სწრაფი მოქმედება"
              viewerRole="staff"
              currentUserId={currentUserId}
            />
          </>
        )}
      </main>

      {deleteTarget && (
        <div className="admin-dialog-backdrop" role="presentation" onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            className="admin-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="admin-dialog__title">შინაგანი კავშირის წაშლა</h2>
            <p className="admin-dialog__text">
              დარწმუნებული ხარ? კავშირი და მისი ისტორია სამუდამოდ წაიშლება.
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

export default InternalChatsPanel
