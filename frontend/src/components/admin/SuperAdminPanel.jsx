import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Globe, LogOut, MousePointerClick, Users, Wrench } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import UsersRolesPanel from './UsersRolesPanel'
import SiteContentPanel from './SiteContentPanel'
import DeveloperPendingPanel from './DeveloperPendingPanel'
import '../../pages/Admin.css'

const ADMIN_TABS = [
  { id: 'users', label: 'მომხმარებლები', icon: Users },
  { id: 'site', label: 'საიტი', icon: Globe },
  { id: 'developers', label: 'შემსრულებლები', icon: Wrench },
]

function SuperAdminPanel() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [error, setError] = useState('')

  return (
    <div className="admin-panel admin-panel--super">
      <div className="admin-panel__header">
        <div>
          <span className="admin-page__badge">Super Admin</span>
          <h1 className="admin-page__title">ადმინ პანელი</h1>
          <p className="admin-page__subtitle">მომხმარებლები · საიტი · შემსრულებლები</p>
        </div>
        <div className="admin-panel__actions">
          <Link to="/dashboard" className="btn btn--outline btn--sm">
            <MousePointerClick size={16} />
            თიქეტები
          </Link>
          <button type="button" className="btn btn--outline btn--sm" onClick={logout}>
            <LogOut size={16} />
            გასვლა
          </button>
        </div>
      </div>

      <nav className="admin-tabs" aria-label="ადმინის ტაბები">
        {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`admin-tabs__btn ${activeTab === id ? 'admin-tabs__btn--active' : ''}`}
            onClick={() => {
              setActiveTab(id)
              setError('')
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {error && <div className="auth-form__alert">{error}</div>}

      {activeTab === 'users' && (
        <UsersRolesPanel adminId={user?.uid} onError={setError} />
      )}
      {activeTab === 'site' && (
        <SiteContentPanel adminId={user?.uid} onError={setError} />
      )}
      {activeTab === 'developers' && (
        <DeveloperPendingPanel adminId={user?.uid} onError={setError} />
      )}
    </div>
  )
}

export default SuperAdminPanel
