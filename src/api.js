/* ── Wandra CRM API client ─────────────────────────────────────────────────
   Talks to the backend's agency realm (/api). The JWT is kept in localStorage
   so a refresh keeps the agency signed in. */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'wandra-crm-token'

let token = localStorage.getItem(TOKEN_KEY) || ''
export const getToken = () => token
export const setToken = (t) => {
  token = t || ''
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}
export const isAuthed = () => !!token

async function request(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401) setToken('')
    throw new Error(json.error || `Request failed (${res.status})`)
  }
  return json
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p, b) => request('DELETE', p, b),
  async login(email, password) {
    const data = await request('POST', '/auth/login', { email, password })
    setToken(data.token)
    return data // { token, user, agency, role, isAdmin, canSeePricing }
  },
  logout() { setToken('') },
  /** Upload a data-URL to S3 via the backend → returns the public URL.
   *  Falls back to the original data-URL if the request fails, so uploads never block. */
  async upload(dataUrl, folder = 'uploads') {
    if (!dataUrl || typeof dataUrl !== 'string' || /^https?:\/\//i.test(dataUrl)) return dataUrl
    try { const r = await request('POST', '/upload', { data: dataUrl, folder }); return r.url }
    catch { return dataUrl }
  },
}

/* Public (unauthenticated) endpoints for client-facing pages. */
export const publicApi = {
  get: (p) => request('GET', '/public' + p),
  post: (p, b) => request('POST', '/public' + p, b),
}

export default api
