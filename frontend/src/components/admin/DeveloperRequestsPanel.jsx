import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  UserCheck,
  UserX,
  Users,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import {
  approveDeveloperRequest,
  formatDeveloperRequestDate,
  getDeveloperRequestInitials,
  rejectDeveloperRequest,
  subscribeToDeveloperRequestsByStatus,
} from '../../services/adminService'
import {
  ACCOUNT_TYPE_LABELS,
  formatRegistrationDate,
  REGISTRATION_STATUS_LABELS,
  subscribeToAllRegistrations,
} from '../../services/registrationService'
import { DEVELOPER_REQUEST_STATUS } from '../../utils/roles'
import '../../pages/Admin.css'

const REQUEST_TABS = [
  {
    id: DEVELOPER_REQUEST_STATUS.PENDING,
    label: 'მოლოდინში',
    emptyTitle: 'ახალი მოთხოვნა არ არის',
    emptyText: 'როცა მომხმარებელი დეველოპერის როლს მოითხოვს, აქ გამოჩნდება.',
    icon: Clock3,
  },
  {
    id: DEVELOPER_REQUEST_STATUS.APPROVED,
    label: 'დადასტურებული',
    emptyTitle: 'დადასტურებული მოთხოვნა არ არის',
    emptyText: 'დადასტურებული დეველოპერები აქ ჩანს ისტორიის სახით.',
    icon: UserCheck,
  },
  {
    id: DEVELOPER_REQUEST_STATUS.REJECTED,
    label: 'უარყოფილი',
    emptyTitle: 'უარყოფილი მოთხოვნა არ არის',
    emptyText: 'უარყოფილი მოთხოვნები აქ ინახება.',
    icon: UserX,
  },
]

const ADMIN_SECTIONS = [
  { id: 'requests', label: 'დეველოპერის მოთხოვნები' },
  { id: 'registrations', label: 'ყველა რეგისტრაცია' },
]

function AdminToast({ message, variant = 'success', onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3200)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className={`admin-toast admin-toast--${variant}`} role="status">
      {variant === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      <span>{message}</span>
    </div>
  )
}

function AdminConfirmDialog({ title, text, onConfirm, onCancel, confirming }) {
  return (
    <div className="admin-dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="admin-dialog-title" className="admin-dialog__title">
          {title}
        </h2>
        <p className="admin-dialog__text">{text}</p>
        <div className="admin-dialog__actions">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onCancel}
            disabled={confirming}
          >
            გაუქმება
          </button>
          <button
            type="button"
            className="btn btn--primary btn--sm admin-request-card__reject"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'იტვირთება...' : 'უარყოფა'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminRequestSkeleton() {
  return (
    <div className="admin-skeleton-list" aria-hidden="true">
      <div className="admin-skeleton-card" />
      <div className="admin-skeleton-card" />
      <div className="admin-skeleton-card" />
    </div>
  )
}

function DeveloperRequestsPanel() {
  const { user } = useAuth()
  const [section, setSection] = useState('requests')
  const [activeTab, setActiveTab] = useState(DEVELOPER_REQUEST_STATUS.PENDING)
  const [requests, setRequests] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const [loadingRegistrations, setLoadingRegistrations] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  })

  useEffect(() => {
    if (section !== 'requests') return undefined

    const unsubscribe = subscribeToDeveloperRequestsByStatus(
      activeTab,
      (items) => {
        setRequests(items)
        setLoadingRequests(false)
      },
      (err) => {
        setError(err.message || 'მოთხოვნების ჩატვირთვა ვერ მოხერხდა.')
        setLoadingRequests(false)
      },
    )

    return unsubscribe
  }, [activeTab, section])

  useEffect(() => {
    if (section !== 'registrations') return undefined

    const unsubscribe = subscribeToAllRegistrations(
      (items) => {
        setRegistrations(items)
        setLoadingRegistrations(false)
      },
      (err) => {
        setError(err.message || 'რეგისტრაციების ჩატვირთვა ვერ მოხერხდა.')
        setLoadingRegistrations(false)
      },
    )

    return unsubscribe
  }, [section])

  useEffect(() => {
    const unsubscribers = [
      subscribeToDeveloperRequestsByStatus(
        DEVELOPER_REQUEST_STATUS.PENDING,
        (items) => setCounts((prev) => ({ ...prev, pending: items.length })),
        () => {},
      ),
      subscribeToDeveloperRequestsByStatus(
        DEVELOPER_REQUEST_STATUS.APPROVED,
        (items) => setCounts((prev) => ({ ...prev, approved: items.length })),
        () => {},
      ),
      subscribeToDeveloperRequestsByStatus(
        DEVELOPER_REQUEST_STATUS.REJECTED,
        (items) => setCounts((prev) => ({ ...prev, rejected: items.length })),
        () => {},
      ),
    ]

    return () => unsubscribers.forEach((unsub) => unsub())
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const handleApprove = async (request) => {
    if (!user?.uid) return
    setError('')
    setProcessingId(request.id)
    try {
      await approveDeveloperRequest(request.id, user.uid)
      setToast({
        message: `${request.name || request.email} დადასტურდა`,
        variant: 'success',
      })
    } catch (err) {
      setError(err.message || 'დადასტურება ვერ მოხერხდა.')
      setToast({ message: 'დადასტურება ვერ მოხერხდა.', variant: 'error' })
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectConfirm = async () => {
    if (!user?.uid || !rejectTarget) return
    setProcessingId(rejectTarget.id)
    try {
      await rejectDeveloperRequest(rejectTarget.id, user.uid)
      setToast({
        message: `${rejectTarget.name || rejectTarget.email} — მოთხოვნა უარყოფილია`,
        variant: 'success',
      })
      setRejectTarget(null)
    } catch (err) {
      setError(err.message || 'უარყოფა ვერ მოხერხდა.')
      setToast({ message: 'უარყოფა ვერ მოხერხდა.', variant: 'error' })
    } finally {
      setProcessingId(null)
    }
  }

  const activeTabConfig = REQUEST_TABS.find((tab) => tab.id === activeTab)
  const EmptyIcon = activeTabConfig?.icon ?? Users

  return (
    <>
      <div className="admin-shell__main admin-shell__main--embedded">
        <div className="admin-section-switch" role="tablist" aria-label="ადმინისტრაციის განყოფილებები">
          {ADMIN_SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={section === id}
              className={`dashboard-filter ${section === id ? 'dashboard-filter--active' : ''}`}
              onClick={() => {
                setSection(id)
                if (id === 'registrations') setLoadingRegistrations(true)
                if (id === 'requests') setLoadingRequests(true)
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {section === 'registrations' ? (
          <>
            <div className="admin-section-title">
              <h2>ყველა რეგისტრაცია</h2>
              <p>ყველა ახალი ანგარიში ინახება აქ — მომხმარებლები და დეველოპერის მოთხოვნები.</p>
            </div>

            {error && <div className="auth-form__alert">{error}</div>}

            {loadingRegistrations ? (
              <AdminRequestSkeleton />
            ) : registrations.length === 0 ? (
              <div className="admin-empty">
                <Users size={40} className="admin-empty__icon" />
                <p className="admin-empty__title">რეგისტრაცია ჯერ არ არის</p>
                <p className="admin-empty__text">
                  ახალი რეგისტრაციები ავტომატურად გამოჩნდება აქ.
                </p>
              </div>
            ) : (
              <ul className="admin-requests">
                {registrations.map((registration) => {
                  const initials = getDeveloperRequestInitials(
                    registration.name,
                    registration.email,
                  )
                  const statusKey = registration.developerRequestStatus || 'none'

                  return (
                    <li key={registration.id} className="admin-request-card admin-request-card--readonly">
                      <div className="admin-request-card__left">
                        <div className="admin-request-card__avatar" aria-hidden="true">
                          {initials}
                        </div>
                        <div className="admin-request-card__info">
                          <strong className="admin-request-card__name">
                            {registration.name || 'უსახელო'}
                          </strong>
                          <span className="admin-request-card__email">{registration.email}</span>
                          <span className="admin-request-card__date">
                            რეგისტრაცია: {formatRegistrationDate(registration.registeredAt)}
                          </span>
                        </div>
                      </div>
                      <div className="admin-request-card__meta-badges">
                        <span className="admin-request-card__tag">
                          {ACCOUNT_TYPE_LABELS[registration.accountType] || registration.accountType}
                        </span>
                        <span
                          className={`admin-request-card__status admin-request-card__status--${
                            statusKey === 'approved'
                              ? 'approved'
                              : statusKey === 'rejected'
                                ? 'rejected'
                                : statusKey === 'pending'
                                  ? 'pending'
                                  : 'neutral'
                          }`}
                        >
                          {REGISTRATION_STATUS_LABELS[statusKey] || statusKey}
                        </span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        ) : (
          <>
        <div className="admin-stats">
          <article className="admin-stat-card">
            <Clock3 size={22} className="admin-stat-card__icon admin-stat-card__icon--amber" />
            <div>
              <span className="admin-stat-card__value">{counts.pending}</span>
              <span className="admin-stat-card__label">მოლოდინში</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <UserCheck size={22} className="admin-stat-card__icon admin-stat-card__icon--green" />
            <div>
              <span className="admin-stat-card__value">{counts.approved}</span>
              <span className="admin-stat-card__label">დადასტურებული</span>
            </div>
          </article>
          <article className="admin-stat-card">
            <UserX size={22} className="admin-stat-card__icon admin-stat-card__icon--muted" />
            <div>
              <span className="admin-stat-card__value">{counts.rejected}</span>
              <span className="admin-stat-card__label">უარყოფილი</span>
            </div>
          </article>
        </div>

        <div className="admin-section-title">
          <h2>დეველოპერის მოთხოვნები</h2>
          <p>დაადასტურე ან უარყო ახალი დეველოპერები</p>
        </div>

        <div className="admin-filters" role="tablist" aria-label="მოთხოვნების ფილტრი">
          {REQUEST_TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              className={`dashboard-filter ${activeTab === id ? 'dashboard-filter--active' : ''}`}
              onClick={() => {
                setActiveTab(id)
                setLoadingRequests(true)
              }}
            >
              {label}
              {id === DEVELOPER_REQUEST_STATUS.PENDING && counts.pending > 0 && (
                <> ({counts.pending})</>
              )}
            </button>
          ))}
        </div>

        {error && <div className="auth-form__alert">{error}</div>}

        {loadingRequests ? (
          <AdminRequestSkeleton />
        ) : requests.length === 0 ? (
          <div className="admin-empty">
            <EmptyIcon size={40} className="admin-empty__icon" />
            <p className="admin-empty__title">{activeTabConfig?.emptyTitle}</p>
            <p className="admin-empty__text">{activeTabConfig?.emptyText}</p>
          </div>
        ) : (
          <ul className="admin-requests">
            {requests.map((request) => {
              const initials = getDeveloperRequestInitials(request.name, request.email)
              const isPending = activeTab === DEVELOPER_REQUEST_STATUS.PENDING
              const dateLabel =
                activeTab === DEVELOPER_REQUEST_STATUS.PENDING
                  ? 'მოთხოვნის თარიღი'
                  : 'განხილვის თარიღი'
              const dateValue =
                activeTab === DEVELOPER_REQUEST_STATUS.PENDING
                  ? request.developerRequestedAt
                  : request.developerReviewedAt

              return (
                <li key={request.id} className="admin-request-card">
                  <div className="admin-request-card__left">
                    <div className="admin-request-card__avatar" aria-hidden="true">
                      {initials}
                    </div>
                    <div className="admin-request-card__info">
                      <strong className="admin-request-card__name">
                        {request.name || 'უსახელო'}
                      </strong>
                      <span className="admin-request-card__email">{request.email}</span>
                      <span className="admin-request-card__date">
                        {dateLabel}: {formatDeveloperRequestDate(dateValue)}
                      </span>
                    </div>
                  </div>

                  {isPending ? (
                    <div className="admin-request-card__actions">
                      <button
                        type="button"
                        className="btn btn--primary btn--sm"
                        disabled={processingId === request.id}
                        onClick={() => handleApprove(request)}
                      >
                        <CheckCircle2 size={16} />
                        დადასტურება
                      </button>
                      <button
                        type="button"
                        className="btn btn--outline btn--sm admin-request-card__reject"
                        disabled={processingId === request.id}
                        onClick={() => setRejectTarget(request)}
                      >
                        <XCircle size={16} />
                        უარყოფა
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`admin-request-card__status admin-request-card__status--${
                        activeTab === DEVELOPER_REQUEST_STATUS.APPROVED ? 'approved' : 'rejected'
                      }`}
                    >
                      {activeTab === DEVELOPER_REQUEST_STATUS.APPROVED
                        ? 'დადასტურებული'
                        : 'უარყოფილი'}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
          </>
        )}
      </div>

      {toast && (
        <AdminToast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />
      )}

      {rejectTarget && (
        <AdminConfirmDialog
          title="მოთხოვნის უარყოფა"
          text={`დარწმუნებული ხარ, რომ გინდა უარყო ${rejectTarget.name || rejectTarget.email}-ის დეველოპერის მოთხოვნა?`}
          onConfirm={handleRejectConfirm}
          onCancel={() => !processingId && setRejectTarget(null)}
          confirming={processingId === rejectTarget.id}
        />
      )}
    </>
  )
}

export default DeveloperRequestsPanel
