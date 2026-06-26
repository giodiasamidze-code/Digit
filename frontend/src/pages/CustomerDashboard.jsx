import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ClipboardList, Home, LogOut, MessageSquare, Plus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CreateCustomerOrderModal from '../components/orders/CreateCustomerOrderModal'
import DigitMark from '../components/DigitMark'
import {
  formatOrderAmount,
  formatOrderDate,
  getCustomerOrderStats,
  ORDER_STATUS_LABELS,
  partitionCustomerOrders,
  PAYMENT_STATUS_LABELS,
  resolvePaymentStatus,
  subscribeToCustomerOrders,
  subscribeToOrder,
} from '../services/orderService'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle } from '../constants/brand'
import './CustomerDashboard.css'
import './DeveloperDashboard.css'

function CustomerOrderDetail({ orderId, onError }) {
  const [order, setOrder] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!orderId) return undefined

    const unsubscribe = subscribeToOrder(
      orderId,
      (data) => {
        setOrder(data)
        setLoaded(true)
      },
      (err) => onError(err.message || 'შეკვეთის ჩატვირთვა ვერ მოხერხდა.'),
    )

    return unsubscribe
  }, [orderId, onError])

  if (!loaded) {
    return <div className="customer-detail customer-detail--loading">იტვირთება...</div>
  }

  if (!order) {
    return <div className="customer-detail customer-detail--empty">შეკვეთა ვერ მოიძებნა.</div>
  }

  const paymentStatus = resolvePaymentStatus(order)

  return (
    <div className="customer-detail">
      <div className="customer-detail__header">
        <h2 className="customer-detail__title">{order.serviceType}</h2>
        <span className={`customer-detail__status customer-detail__status--${order.status}`}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <dl className="customer-detail__meta">
        <div>
          <dt>შექმნის თარიღი</dt>
          <dd>{formatOrderDate(order.createdAt)}</dd>
        </div>
        <div>
          <dt>განახლება</dt>
          <dd>{formatOrderDate(order.updatedAt)}</dd>
        </div>
        {order.assignedDeveloperName && (
          <div>
            <dt>სპეციალისტი</dt>
            <dd>{order.assignedDeveloperName}</dd>
          </div>
        )}
        {order.price != null && (
          <div>
            <dt>ღირებულება</dt>
            <dd>{formatOrderAmount(order.price)}</dd>
          </div>
        )}
        <div>
          <dt>გადახდა</dt>
          <dd>{PAYMENT_STATUS_LABELS[paymentStatus]}</dd>
        </div>
      </dl>

      <div className="customer-detail__section">
        <h3>აღწერა</h3>
        <p>{order.description}</p>
      </div>

      <Link to="/contact" className="btn btn--outline customer-detail__chat-btn">
        <MessageSquare size={18} />
        მოთხოვნის გაგზავნა
      </Link>
    </div>
  )
}

function CustomerDashboard() {
  usePageMeta(pageTitle('ჩემი შეკვეთები'), 'DIGIT — შეკვეთების თვალყური და სტატუსი.')

  const { user, userProfile, logout } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const serviceFromUrl = searchParams.get('service')
  const [tab, setTab] = useState('active')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(Boolean(serviceFromUrl))
  const [initialServiceId, setInitialServiceId] = useState(serviceFromUrl)

  const handleError = useCallback((message) => setError(message), [])

  useEffect(() => {
    if (!user?.uid) return undefined

    const unsubscribe = subscribeToCustomerOrders(
      user.uid,
      (list) => {
        setOrders(list)
        setLoading(false)
      },
      (err) => {
        setError(err.message || 'შეკვეთების ჩატვირთვა ვერ მოხერხდა.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [user?.uid])

  useEffect(() => {
    if (serviceFromUrl) {
      setSearchParams({}, { replace: true })
    }
  }, [serviceFromUrl, setSearchParams])

  const { active, archived } = useMemo(() => partitionCustomerOrders(orders), [orders])
  const stats = useMemo(() => getCustomerOrderStats(orders), [orders])
  const visibleOrders = tab === 'active' ? active : archived
  const selectedOrderIdResolved =
    selectedOrderId && visibleOrders.some((order) => order.id === selectedOrderId)
      ? selectedOrderId
      : visibleOrders[0]?.id ?? null

  const handleTabChange = (nextTab) => {
    setTab(nextTab)
    const pool = nextTab === 'active' ? active : archived
    setSelectedOrderId(pool[0]?.id ?? null)
  }

  const handleOrderCreated = (orderId) => {
    setTab('active')
    setSelectedOrderId(orderId)
    setError('')
  }

  return (
    <div className="dashboard dev-dashboard customer-dashboard">
      <header className="dashboard__header dev-dashboard__header">
        <div className="dashboard__header-left">
          <DigitMark size="sm" />
          <div>
            <h1 className="dashboard__title">ჩემი შეკვეთები</h1>
            <span className="dashboard__badge dev-dashboard__badge">მომხმარებელი</span>
          </div>
        </div>
        <div className="dashboard__header-actions">
          <Link to="/" className="btn btn--ghost btn--sm">
            <Home size={16} />
            მთავარი
          </Link>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => logout()}>
            <LogOut size={16} />
            გასვლა
          </button>
        </div>
      </header>

      <div className="dev-dashboard__stats customer-dashboard__stats">
        <div className="dev-stat-card">
          <ClipboardList className="dev-stat-card__icon" size={22} />
          <div>
            <span className="dev-stat-card__value">{stats.activeCount}</span>
            <span className="dev-stat-card__label">აქტიური შეკვეთა</span>
          </div>
        </div>
        <div className="dev-stat-card">
          <ClipboardList className="dev-stat-card__icon dev-stat-card__icon--green" size={22} />
          <div>
            <span className="dev-stat-card__value">{stats.completedCount}</span>
            <span className="dev-stat-card__label">დასრულებული</span>
          </div>
        </div>
        <button
          type="button"
          className="btn btn--primary customer-dashboard__new-btn"
          onClick={() => {
            setInitialServiceId(null)
            setShowCreateModal(true)
          }}
        >
          <Plus size={18} />
          ახალი შეკვეთა
        </button>
      </div>

      {error && <div className="customer-dashboard__error">{error}</div>}

      <div className="dev-dashboard__body">
        <aside className="dev-dashboard__sidebar">
          <div className="dev-dashboard__tabs">
            <button
              type="button"
              className={`dev-dashboard__tab ${tab === 'active' ? 'dev-dashboard__tab--active' : ''}`}
              onClick={() => handleTabChange('active')}
            >
              აქტიური ({active.length})
            </button>
            <button
              type="button"
              className={`dev-dashboard__tab ${tab === 'archived' ? 'dev-dashboard__tab--active' : ''}`}
              onClick={() => handleTabChange('archived')}
            >
              ისტორია ({archived.length})
            </button>
          </div>

          <div className="dev-dashboard__list">
            {loading ? (
              <p className="customer-dashboard__hint">იტვირთება...</p>
            ) : visibleOrders.length === 0 ? (
              <p className="customer-dashboard__hint">
                {tab === 'active' ? 'აქტიური შეკვეთა არ არის.' : 'ისტორია ცარიელია.'}
              </p>
            ) : (
              visibleOrders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`dev-order-card ${selectedOrderIdResolved === order.id ? 'dev-order-card--active' : ''}`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <div className="dev-order-card__top">
                    <span className="dev-order-card__name">{order.serviceType}</span>
                    <span className={`dev-order-card__status dev-order-card__status--${order.status}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <span className="dev-order-card__service">{formatOrderDate(order.updatedAt)}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="dev-dashboard__main customer-dashboard__main">
          {selectedOrderIdResolved ? (
            <CustomerOrderDetail orderId={selectedOrderIdResolved} onError={handleError} />
          ) : (
            <div className="customer-detail customer-detail--empty">
              <p>აირჩიეთ შეკვეთა ან შექმენით ახალი.</p>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setInitialServiceId(null)
                  setShowCreateModal(true)
                }}
              >
                <Plus size={18} />
                ახალი შეკვეთა
              </button>
            </div>
          )}
        </main>
      </div>

      {showCreateModal && user && (
        <CreateCustomerOrderModal
          user={user}
          customerName={userProfile?.name}
          initialServiceId={initialServiceId}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleOrderCreated}
        />
      )}
    </div>
  )
}

export default CustomerDashboard
