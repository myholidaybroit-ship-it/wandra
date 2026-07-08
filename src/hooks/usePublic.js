import { useEffect, useState } from 'react'
import { publicApi } from '../api'

/**
 * Fetch a public (unauthenticated) resource by path, e.g. `/itinerary/PKG-1`.
 * Used by the standalone client-facing pages (itinerary, invoice, voucher,
 * landing site, gallery) which may be opened in a fresh tab with no session.
 */
export function usePublic(path) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    setLoading(true); setError(null)
    publicApi.get(path)
      .then((d) => { if (alive) { setData(d); setLoading(false) } })
      .catch((e) => { if (alive) { setError(e); setLoading(false) } })
    return () => { alive = false }
  }, [path])
  return { data, error, loading }
}

export default usePublic
