import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import DigitMark from '../components/DigitMark'
import FirebaseSetupNotice from '../components/FirebaseSetupNotice'
import { getAuthErrorMessage, validateEmail, validatePassword } from '../utils/authErrors'
import {
  DEVELOPER_REQUEST_STATUS,
  isManagerRole,
  isStaffRole,
} from '../utils/roles'
import { ensureAdminAccount } from '../utils/ensureAdminAccount'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle, SITE_NAME } from '../constants/brand'
import './Auth.css'
import './Admin.css'

function AdminLogin({ onLoggedIn, adminSeedError, accessError }) {
  const { login, isFirebaseConfigured } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validateForm = () => {
    const errors = {}
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    if (emailError) errors.email = emailError
    if (passwordError) errors.password = passwordError
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!validateForm()) return

    setSubmitting(true)
    try {
      await login(email.trim(), password)
      onLoggedIn()
    } catch (err) {
      setFormError(getAuthErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login__ambient" aria-hidden="true" />
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <div className="admin-login__logo-row">
            <DigitMark size="sm" />
            <span className="admin-login__logo-text">{SITE_NAME}</span>
          </div>
          <span className="admin-login__eyebrow">ადმინისტრაცია</span>
          <h1 className="admin-login__title">ადმინისტრაციის პანელი</h1>
          <p className="admin-login__subtitle">შედი მენეჯერის ანგარიშით სისტემის მართვისთვის</p>
          {import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' && (
            <p className="admin-login__hint">
              ლოკალური admin: admin@gmail.com / admin123
            </p>
          )}
        </div>

        {!isFirebaseConfigured && <FirebaseSetupNotice />}
        {(adminSeedError || accessError || formError) && (
          <div className="admin-login__alerts">
            {adminSeedError && <div className="auth-form__alert">{adminSeedError}</div>}
            {accessError && <div className="auth-form__alert">{accessError}</div>}
            {formError && <div className="auth-form__alert">{formError}</div>}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-form__field">
            <label htmlFor="admin-email" className="auth-form__label">
              ელ. ფოსტა
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              className={`auth-form__input ${fieldErrors.email ? 'auth-form__input--error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting || !isFirebaseConfigured}
            />
            {fieldErrors.email && <span className="auth-form__error">{fieldErrors.email}</span>}
          </div>

          <div className="auth-form__field">
            <label htmlFor="admin-password" className="auth-form__label">
              პაროლი
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              className={`auth-form__input ${fieldErrors.password ? 'auth-form__input--error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting || !isFirebaseConfigured}
            />
            {fieldErrors.password && (
              <span className="auth-form__error">{fieldErrors.password}</span>
            )}
          </div>

          <button
            type="submit"
            className="btn btn--accent btn--lg auth-form__submit"
            disabled={submitting || !isFirebaseConfigured}
          >
            {submitting ? 'იტვირთება...' : 'შესვლა'}
          </button>
        </form>

        <p className="admin-login__footer">
          <Link to="/">მთავარი გვერდი</Link>
        </p>
      </div>
    </div>
  )
}

function Admin() {
  usePageMeta(pageTitle('ადმინისტრაცია'), 'DIGIT — ადმინისტრაციის პანელი.')

  const { user, userProfile, loading, logout, refreshUserProfile } = useAuth()
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [accessError, setAccessError] = useState('')
  const [adminReady, setAdminReady] = useState(
    import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'true',
  )
  const [adminSeedError, setAdminSeedError] = useState('')

  useEffect(() => {
    if (import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'true') return undefined

    let cancelled = false

    ensureAdminAccount()
      .then(() => {
        if (!cancelled) {
          setAdminReady(true)
          setAdminSeedError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAdminReady(true)
          setAdminSeedError(
            err.message ||
              'Admin ანგარიში ვერ შეიქმნა. გადატვირთე dev server (npm run dev:all).',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleLoggedIn = async () => {
    setCheckingAccess(true)
    setAccessError('')
    try {
      const profile = await refreshUserProfile()

      if (profile?.developerRequestStatus === DEVELOPER_REQUEST_STATUS.PENDING) {
        await logout()
        setAccessError('თქვენი დეველოპერის მოთხოვნა admin-ის დადასტურებას ელოდება.')
        return
      }

      if (!isStaffRole(profile?.role)) {
        await logout()
        setAccessError('ამ ანგარიშს არ აქვს admin წვდომა.')
      }
    } finally {
      setCheckingAccess(false)
    }
  }

  if (loading || checkingAccess || !adminReady) {
    return (
      <div className="admin-login">
        <div className="auth-loading">
          <div className="auth-loading__spinner" aria-label="იტვირთება..." />
        </div>
      </div>
    )
  }

  if (user && isManagerRole(userProfile?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  if (user && userProfile?.role === 'developer') {
    return <Navigate to="/developer-dashboard" replace />
  }

  return (
    <AdminLogin
      onLoggedIn={handleLoggedIn}
      adminSeedError={adminSeedError}
      accessError={accessError}
    />
  )
}

export default Admin
