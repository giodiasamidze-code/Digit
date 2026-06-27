/** Keep in sync with backend/firestore.rules → isBootstrapManagerEmail() */
export const BOOTSTRAP_MANAGER_EMAILS = [
  'admin@gmail.com',
  'giorgidiasamidze848@gmail.com',
]

export function isBootstrapManagerEmail(email) {
  if (!email) return false
  return BOOTSTRAP_MANAGER_EMAILS.includes(email.trim().toLowerCase())
}
