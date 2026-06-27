export const STAFF_ROLES = ['manager', 'developer']
export const DEVELOPER_REQUEST_STATUS = {
  NONE: 'none',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

export const ROLE_LABELS = {
  customer: 'ბიზნესი',
  manager: 'მენეჯერი',
  developer: 'შემსრულებელი',
  admin: 'ადმინი',
}

export function isStaffRole(role) {
  return STAFF_ROLES.includes(role)
}

export function isManagerRole(role) {
  return role === 'manager'
}

export function isAdminRole(role) {
  return role === 'admin'
}

export function isManagerOrAdminRole(role) {
  return role === 'manager' || role === 'admin'
}

export function isDeveloperRole(role) {
  return role === 'developer'
}

export function getStaffConversationType(role) {
  if (role === 'admin') return 'manager'
  return role
}

export function resolveUserRole(userProfile) {
  return userProfile?.role ?? 'customer'
}

export const ROLE_DEFAULT_ROUTES = {
  customer: '/',
  developer: '/developer-dashboard',
  manager: '/dashboard',
  admin: '/admin',
}

const ROUTE_ALLOWED_ROLES = {
  '/contact': ['customer'],
  '/my-orders': ['customer'],
  '/admin': ['admin'],
  '/dashboard': ['manager', 'admin'],
  '/dashboard/chats': ['manager', 'admin'],
  '/dashboard/internal': ['manager', 'admin'],
  '/dashboard/orders': ['manager', 'admin'],
  '/developer-dashboard': ['developer'],
}

export function getDefaultRouteForRole(role) {
  return ROLE_DEFAULT_ROUTES[role] ?? ROLE_DEFAULT_ROUTES.customer
}

export function isPathAllowedForRole(pathname, role) {
  const resolvedRole = role ?? 'customer'
  const normalized = pathname.replace(/\/$/, '') || '/'
  const allowedRoles = ROUTE_ALLOWED_ROLES[normalized]

  if (!allowedRoles) return true
  return allowedRoles.includes(resolvedRole)
}

export function getPostLoginRedirect(role, fromPath) {
  const resolvedRole = role ?? 'customer'
  const defaultRoute = getDefaultRouteForRole(resolvedRole)

  if (fromPath && fromPath !== '/login' && fromPath !== '/register') {
    const pathname = fromPath.split('?')[0].replace(/\/$/, '') || '/'
    if (isPathAllowedForRole(pathname, resolvedRole)) {
      return fromPath
    }
  }

  return defaultRoute
}

export function getBootstrapManagerEmails() {
  const raw = import.meta.env.VITE_BOOTSTRAP_MANAGER_EMAILS || ''
  return raw
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function isBootstrapAdminEmail(email) {
  if (!email) return false
  return email.trim().toLowerCase() === 'admin@gmail.com'
}

export function isBootstrapManagerEmail(email) {
  if (!email) return false
  const normalized = email.trim().toLowerCase()
  if (normalized === 'admin@gmail.com') return false
  return getBootstrapManagerEmails().includes(normalized)
}

export function buildRegistrationProfile(email, accountType) {
  if (isBootstrapAdminEmail(email)) {
    return {
      role: 'admin',
      developerRequestStatus: DEVELOPER_REQUEST_STATUS.NONE,
      pendingDeveloper: false,
    }
  }

  if (isBootstrapManagerEmail(email)) {
    return {
      role: 'manager',
      developerRequestStatus: DEVELOPER_REQUEST_STATUS.NONE,
      pendingDeveloper: false,
    }
  }

  if (accountType === 'developer') {
    return {
      role: 'customer',
      developerRequestStatus: DEVELOPER_REQUEST_STATUS.PENDING,
      pendingDeveloper: true,
    }
  }

  return {
    role: 'customer',
    developerRequestStatus: DEVELOPER_REQUEST_STATUS.NONE,
    pendingDeveloper: false,
  }
}
