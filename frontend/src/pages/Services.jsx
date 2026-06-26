import { Link } from 'react-router-dom'
import Reveal from '../components/Reveal'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle } from '../constants/brand'
import { allServices } from '../data/services'
import './Services.css'

function getServiceRequestLink(id) {
  const params = new URLSearchParams({ service: id, autoRequest: '1' })
  return `/contact?${params}`
}

function Services() {
  usePageMeta(
    pageTitle('სერვისები'),
    'DIGIT — სერვისების კატალოგი. გადამოწმებული პარტნიორები და მენეჯერის ხარისხის კონტროლი.'
  )

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <Reveal variant="fade">
            <span className="relay-line" />
            <h1 className="page__title">სერვისები</h1>
            <p className="page__subtitle">
              ყველა სერვისს ახორციელებენ გადამოწმებული პარტნიორები — DIGIT მენეჯერი
              კონტროლს უწევს ხარისხს და კომუნიკაციას.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="page services-page">
        <div className="container">
          <div className="services-page__grid">
          {allServices.map(({ id, icon: Icon, title, description, custom }, index) => (
            <Reveal
              key={id}
              className={`service-item ${custom ? 'service-item--custom' : ''}`}
              delay={index * 80}
            >
              <div className="service-item__icon">
                <Icon size={26} strokeWidth={1.75} />
              </div>
              <h2 className="service-item__title">{title}</h2>
              <p className="service-item__desc">{description}</p>
              <Link
                to={getServiceRequestLink(id)}
                className={`btn ${custom ? 'btn--outline' : 'btn--primary'} service-item__btn`}
              >
                მოითხოვე ეს სერვისი
              </Link>
            </Reveal>
          ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default Services
