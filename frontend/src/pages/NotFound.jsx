import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle } from '../constants/brand'

function NotFound() {
  usePageMeta(pageTitle('გვერდი ვერ მოიძებნა'), 'DIGIT — მოთხოვნილი გვერდი არ არსებობს.')

  return (
    <div className="page" style={{ padding: '4rem 0', textAlign: 'center' }}>
      <div className="container">
        <h1 className="page__title">404</h1>
        <p className="page__subtitle" style={{ marginBottom: '1.5rem' }}>
          გვერდი ვერ მოიძებნა.
        </p>
        <Link to="/" className="btn btn--primary">
          მთავარ გვერდზე დაბრუნება
        </Link>
      </div>
    </div>
  )
}

export default NotFound
