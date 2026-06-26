import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import Home from './pages/Home'
import Services from './pages/Services'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import DeveloperDashboard from './pages/DeveloperDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import Admin from './pages/Admin'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="about" element={<About />} />
          <Route
            path="contact"
            element={
              <RoleProtectedRoute allowedRoles={['customer']}>
                <Contact />
              </RoleProtectedRoute>
            }
          />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route
            path="my-orders"
            element={
              <RoleProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </RoleProtectedRoute>
            }
          />
        </Route>

        <Route path="/admin" element={<Admin />} />

        <Route
          path="/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['manager']}>
              <Dashboard key="admin" initialTab="admin" />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/dashboard/chats"
          element={
            <RoleProtectedRoute allowedRoles={['manager']}>
              <Dashboard key="chats" initialTab="chats" />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/dashboard/internal"
          element={
            <RoleProtectedRoute allowedRoles={['manager']}>
              <Dashboard key="internal" initialTab="internal" />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/dashboard/orders"
          element={
            <RoleProtectedRoute allowedRoles={['manager']}>
              <Dashboard key="orders" initialTab="orders" />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/developer-dashboard"
          element={
            <RoleProtectedRoute allowedRoles={['developer']}>
              <DeveloperDashboard />
            </RoleProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
