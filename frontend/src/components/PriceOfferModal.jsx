import { useState } from 'react'
import './PriceOfferModal.css'

function PriceOfferModal({ onClose, onSubmit, submitting }) {
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const numericPrice = Number(price)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('შეიყვანეთ სწორი ფასი.')
      return
    }

    if (!description.trim()) {
      setError('აღწერა სავალდებულოა.')
      return
    }

    try {
      await onSubmit({ price: numericPrice, description: description.trim() })
    } catch (err) {
      setError(err.message || 'შეთავაზების გაგზავნა ვერ მოხერხდა.')
    }
  }

  return (
    <div className="price-offer-modal-backdrop" role="presentation" onClick={() => !submitting && onClose()}>
      <div
        className="price-offer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-offer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="price-offer-title" className="price-offer-modal__title">
          ფასის შეთავაზება
        </h2>
        <p className="price-offer-modal__hint">მომხმარებელს მიეწოდება ფასი და აღწერა დასადასტურებლად.</p>

        {error && <div className="price-offer-modal__error">{error}</div>}

        <form className="price-offer-modal__form" onSubmit={handleSubmit}>
          <label className="price-offer-modal__field">
            <span>ფასი (₾)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={submitting}
              placeholder="150"
            />
          </label>

          <label className="price-offer-modal__field">
            <span>რას მოიცავს</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              placeholder="მაგ. ვებ-გვერდის 5 გვერდი, მობილური ადაპტაცია, 2 რევიზია..."
            />
          </label>

          <div className="price-offer-modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
              გაუქმება
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'იგზავნება...' : 'გაგზავნა'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PriceOfferModal
