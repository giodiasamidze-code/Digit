import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import {
  approveDeveloperRequest,
  formatDeveloperRequestDate,
  getDeveloperRequestInitials,
  rejectDeveloperRequest,
  subscribeToPendingDeveloperRequests,
} from '../../services/adminService'

function DeveloperPendingPanel({ adminId, onError }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToPendingDeveloperRequests(
      (items) => {
        setRequests(items)
        setLoading(false)
      },
      (err) => {
        onError(err.message || 'მოთხოვნების ჩატვირთვა ვერ მოხერხდა.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [onError])

  const handleApprove = async (requestId) => {
    if (!adminId) return
    setProcessingId(requestId)
    try {
      await approveDeveloperRequest(requestId, adminId)
    } catch (err) {
      onError(err.message || 'დადასტურება ვერ მოხერხდა.')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId) => {
    if (!adminId) return
    setProcessingId(requestId)
    try {
      await rejectDeveloperRequest(requestId, adminId)
    } catch (err) {
      onError(err.message || 'უარყოფა ვერ მოხერხდა.')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return <div className="admin-panel__empty">იტვირთება...</div>
  }

  if (requests.length === 0) {
    return <div className="admin-panel__empty">ახალი შემსრულებლის მოთხოვნა არ არის.</div>
  }

  return (
    <div className="admin-section">
      <div className="admin-section__head">
        <div>
          <h2>შემსრულებლის მოთხოვნები</h2>
          <p>დაადასტურე ან უარყო ახალი შემსრულებლები.</p>
        </div>
      </div>

      <ul className="admin-requests">
        {requests.map((request) => {
          const initials = getDeveloperRequestInitials(request.name, request.email)

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
                    მოთხოვნის თარიღი:{' '}
                    {formatDeveloperRequestDate(request.developerRequestedAt)}
                  </span>
                </div>
              </div>
              <div className="admin-request-card__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  disabled={processingId === request.id}
                  onClick={() => handleApprove(request.id)}
                >
                  <CheckCircle2 size={16} />
                  დადასტურება
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm admin-request-card__reject"
                  disabled={processingId === request.id}
                  onClick={() => handleReject(request.id)}
                >
                  <XCircle size={16} />
                  უარყოფა
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default DeveloperPendingPanel
