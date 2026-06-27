import { Navigate, Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import FirebaseSetupNotice from './FirebaseSetupNotice'
import { useAuth } from '../context/AuthContext'
import { isFirebaseConfigured } from '../firebase'
import { isAdminRole, isManagerRole, resolveUserRole } from '../utils/roles'

function Layout() {
  const { user, userProfile, loading } = useAuth()
  const role = resolveUserRole(userProfile)

  if (!loading && user && isAdminRole(role)) {
    return <Navigate to="/admin" replace />
  }

  if (!loading && user && isManagerRole(role)) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <>
      <Navbar />
      {!isFirebaseConfigured && (
        <div className="container" style={{ paddingTop: '1rem' }}>
          <FirebaseSetupNotice />
        </div>
      )}
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

export default Layout
