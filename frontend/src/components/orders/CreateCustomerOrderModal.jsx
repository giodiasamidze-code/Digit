import { useEffect, useState } from 'react'
import { allServices } from '../../data/services'
import { createCustomerOrder } from '../../services/orderService'
import { MAX_ORDER_DESCRIPTION_LENGTH, validateMessageLength } from '../../utils/validation'
import './CreateCustomerOrderModal.css'

function CreateCustomerOrderModal({ user, customerName, initialServiceId, onClose, onCreated }) {
  const initialService = allServices.find((s) => s.id === initialServiceId) ?? allServices[0]

  const [serviceType, setServiceType] = useState(initialService?.title ?? '')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedDescription = description.trim()
    const lengthError = validateMessageLength(trimmedDescription, MAX_ORDER_DESCRIPTION_LENGTH)

    if (!user || !serviceType.trim() || !trimmedDescription || lengthError) {
      if (lengthError) setError(lengthError)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const service = allServices.find((s) => s.title === serviceType)
      const { orderId } = await createCustomerOrder({
        customerId: user.uid,
        customerName: customerName || user.email?.split('@')[0] || 'მომხმარებელი',
        serviceType: serviceType.trim(),
        description: trimmedDescription,
        serviceRequested: service?.id ?? null,
      })
      onCreated?.(orderId)
      onClose()
    } catch (err) {
      setError(err.message || 'შეკვეთის შექმნა ვერ მოხერხდა.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="customer-order-modal" role="dialog" aria-modal="true">
      <button type="button" className="customer-order-modal__backdrop" onClick={onClose} aria-label="დახურვა" />
      <div className="customer-order-modal__panel">
        <header className="customer-order-modal__header">
          <h2>ახალი შეკვეთა</h2>
          <button type="button" className="customer-order-modal__close" onClick={onClose} aria-label="დახურვა">
            ×
          </button>
        </header>

        <form className="customer-order-modal__form" onSubmit={handleSubmit}>
          {error && <div className="customer-order-modal__error">{error}</div>}

          <label className="customer-order-modal__field">
            <span>სერვისის ტიპი</span>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              disabled={submitting}
            >
              {allServices.map((service) => (
                <option key={service.id} value={service.title}>
                  {service.title}
                </option>
              ))}
            </select>
          </label>

          <label className="customer-order-modal__field">
            <span>აღწერა</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="აღწერეთ რა გჭირდებათ..."
              disabled={submitting}
              maxLength={MAX_ORDER_DESCRIPTION_LENGTH}
            />
          </label>

          <div className="customer-order-modal__actions">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={submitting}>
              გაუქმება
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'იგზავნება...' : 'შეკვეთის გაგზავნა'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCustomerOrderModal
