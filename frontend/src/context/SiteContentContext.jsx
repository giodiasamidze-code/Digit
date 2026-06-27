import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { isFirebaseConfigured } from '../firebase'
import { mergeSiteContent } from '../data/siteContentDefaults'
import { subscribeToSiteContent } from '../services/siteContentService'

const SiteContentContext = createContext(null)

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(() => mergeSiteContent(null))
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false)
      return undefined
    }

    return subscribeToSiteContent(
      (nextContent) => {
        setContent(nextContent)
        setLoading(false)
      },
      () => {
        setLoading(false)
      },
    )
  }, [])

  const value = useMemo(() => ({ content, loading }), [content, loading])

  return (
    <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
  )
}

export function useSiteContent() {
  const context = useContext(SiteContentContext)
  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider')
  }
  return context
}
