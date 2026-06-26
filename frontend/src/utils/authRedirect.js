export function getReturnPath(fromLocation) {
  if (!fromLocation) return '/'
  return `${fromLocation.pathname}${fromLocation.search || ''}${fromLocation.hash || ''}`
}
