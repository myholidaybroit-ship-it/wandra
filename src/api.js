/* ── Wandra CRM API client ─────────────────────────────────────────────────
   Talks to the backend's agency realm (/api). Tokens are kept in memory and
   mirrored to sessionStorage by default; "keep me signed in" uses localStorage.
   The backend also sets/clears an HttpOnly cookie when available. */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const TOKEN_KEY = 'wandra-crm-token'
const TOKEN_META_KEY = 'wandra-crm-token-meta'

const safeStorage = (kind) => {
  try { return kind === 'local' ? localStorage : sessionStorage } catch { return null }
}
const decodeJwtPayload = (t) => {
  try {
    const part = String(t || '').split('.')[1]
    if (!part) return null
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=')
    const json = atob(padded)
    return JSON.parse(decodeURIComponent(Array.from(json).map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')))
  } catch { return null }
}
const tokenExpired = (t) => {
  const exp = decodeJwtPayload(t)?.exp
  return exp ? Date.now() >= exp * 1000 : false
}
const clearStoredToken = () => {
  ;[safeStorage('local'), safeStorage('session')].forEach((s) => {
    s?.removeItem(TOKEN_KEY)
    s?.removeItem(TOKEN_META_KEY)
  })
}
const readStoredToken = () => {
  const local = safeStorage('local')?.getItem(TOKEN_KEY)
  const session = safeStorage('session')?.getItem(TOKEN_KEY)
  const stored = local || session || ''
  if (stored && tokenExpired(stored)) {
    clearStoredToken()
    return ''
  }
  return stored
}

let token = readStoredToken()
export const getToken = () => token
export const setToken = (t, opts = {}) => {
  token = t || ''
  clearStoredToken()
  if (t) {
    const storage = safeStorage(opts.persist ? 'local' : 'session')
    storage?.setItem(TOKEN_KEY, t)
    storage?.setItem(TOKEN_META_KEY, JSON.stringify({ exp: decodeJwtPayload(t)?.exp || null, persist: !!opts.persist }))
  }
}
export const isAuthed = () => !!token && !tokenExpired(token)
export const sessionExpiresAt = () => {
  const exp = decodeJwtPayload(token)?.exp
  return exp ? new Date(exp * 1000) : null
}

async function request(method, path, body) {
  if (token && tokenExpired(token)) setToken('')
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
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
  async login(email, password, opts = {}) {
    const data = await request('POST', '/auth/login', { email, password })
    setToken(data.token, { persist: !!opts.remember })
    return data // { token, user, agency, role, isAdmin, canSeePricing }
  },
  logout() { request('POST', '/auth/logout').catch(() => {}); setToken('') },
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
