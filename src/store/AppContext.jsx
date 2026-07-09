import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { api, publicApi, isAuthed, setToken, sessionExpiresAt } from '../api'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

// safe empty shape for the dashboard until the API responds (all live-computed)
const EMPTY_DASH = {
  series: { revenue: [], bookings: [], packages: [], clients: [] },
  recentActivity: [],
  analytics: {
    months: [], grossByMonth: [], collectedByMonth: [], bookingsByMonth: [], profitByMonth: [],
    marginPctByMonth: [], monthlyTarget: 1, weeklyInquiries: [], weekDays: [], leadFunnel: [],
    leadSources: [], packageStatusMix: [], topDestinations: [], clientCities: [], invoiceAging: [],
    ratingAvg: 0, ratingCount: 0, ratingDist: [], heatDays: [], heatWeeks: [], inquiryHeatmap: [],
  },
  kpis: {},
}

// sentinel: "let the assignment rules decide" (used by the New Query form)
export const AUTO_ASSIGNEE = '__auto__'

export const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

export const DEFAULT_INVOICE_SETTINGS = {
  defaultGst: 18,
  defaultDue: 15,
  type: 'Non-GST',
  terms: 'Payable within 15 days. 50% advance to confirm booking.',
  footer: 'Thank you for travelling with us.',
}

/* ---- Pricing engine (identical to the backend's services/pricing.js) ---- */
export function computePricing(pkg) {
  if (pkg.pricing?.mode === 'Builder' && pkg.pricing.grandTotal != null) {
    const p = pkg.pricing
    return {
      cabTotal: p.transportSell || 0,
      hotelTotal: p.hotelSell || 0,
      otherTotal: (p.flightSell || 0) + (p.extraSell || 0),
      subtotal: p.sellingPrice || 0,
      discount: 0,
      gstPercent: p.gstPercent || 0,
      gstAmount: p.gstAmount || 0,
      grandTotal: p.grandTotal || 0,
      componentsCost: p.costPrice || 0,
      profit: p.profit || 0,
    }
  }
  const cabTotal = (pkg.cabs || []).reduce((s, c) => s + (Number(c.km) || 0) * (Number(c.rate) || 0), 0)
  const hotelTotal = (pkg.hotelsAlloc || []).reduce((s, h) => s + (Number(h.price) || 0), 0)
  const otherTotal = (pkg.categories || []).reduce((s, c) => s + (Number(c.amount) || 0), 0)
  const base = Number(pkg.pricing?.packageCost || 0) + Number(pkg.pricing?.childCost || 0)
  const subtotal = base + cabTotal + hotelTotal + otherTotal
  const discount = Number(pkg.pricing?.discount || 0)
  const afterDiscount = Math.max(0, subtotal - discount)
  const gstPercent = Number(pkg.pricing?.gstPercent || 0)
  const gstAmount = Math.round((afterDiscount * gstPercent) / 100)
  const grandTotal = afterDiscount + gstAmount
  const hotelNet = (pkg.hotelsAlloc || []).reduce((s, h) => s + (Number(h.net) || 0), 0)
  const componentsCost = hotelNet + cabTotal
  const profit = grandTotal - componentsCost - otherTotal
  return { cabTotal, hotelTotal, otherTotal, subtotal, discount, gstPercent, gstAmount, grandTotal, componentsCost, profit }
}

/**
 * Shape the API agency into what the CRM components expect:
 * the frontend reads `agency.plan.name` / `agency.plan.limit`, but the backend
 * stores `plan` as a string ('Free'/'Pro') plus a numeric `limits` map.
 */
function normalizeAgency(ag) {
  if (!ag) return ag
  const clientLimit = ag.limits?.clients
  return {
    ...ag,
    bank: ag.bank || {},
    invoiceSettings: { ...DEFAULT_INVOICE_SETTINGS, ...(ag.invoiceSettings || {}) },
    plan: { name: ag.plan, limit: clientLimit > 0 ? clientLimit : -1 }, // -1 = unlimited
  }
}

export function AppProvider({ children }) {
  // ── session ──
  const [session, setSession] = useState(null)   // { user, agency, role, isAdmin, canSeePricing }
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(isAuthed())

  // ── plan feature flags (admin-controlled, per-agency) ──
  const [features, setFeatures] = useState({})   // { 'dashboard.view': true, ... }
  const [limitsMap, setLimitsMap] = useState({})

  // ── tenant data (everything loaded from the API — no local seed) ──
  const [agency, setAgencyState] = useState(null)
  const [destinations, setDestinations] = useState([])
  const [hotels, setHotels] = useState([])
  const [cabs, setCabs] = useState([])
  const [serviceLocations, setServiceLocations] = useState([])
  const [activities, setActivities] = useState([])
  const [packageTemplates, setPackageTemplates] = useState([])
  const [inclusionPresets, setInclusionPresets] = useState({ byDest: {} })
  const [clients, setClients] = useState([])
  const [packages, setPackages] = useState([])
  const [bookings, setBookings] = useState([])
  const [invoices, setInvoices] = useState([])
  const [quotations, setQuotations] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [gallery, setGallery] = useState([])
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [assignment, setAssignment] = useState({ enabled: true, rules: [], fallback: { mode: 'all', members: [], next: 0 } })
  const [landing, setLanding] = useState(null)
  const [dashboard, setDashboard] = useState(EMPTY_DASH)

  // platform config (served from the backend via /config)
  const [categoryGroups, setCategoryGroups] = useState([])
  const [themes, setThemes] = useState([])
  const [templates, setTemplates] = useState([])
  const [plans, setPlans] = useState([])

  // "view as" — local switch over the loaded users for permission preview
  const [currentUserId, setCurrentUserId] = useState(null)
  const [toasts, setToasts] = useState([])

  const tRef = useRef(0)
  const toast = useCallback((msg) => {
    const id = 't' + (++tRef.current)
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  /* ---------- reload helpers (server owns cascades; client refetches) ---------- */
  const LOADERS = {
    destinations: () => api.get('/destinations').then((r) => setDestinations(r.items)),
    hotels: () => api.get('/hotels').then((r) => setHotels(r.items)),
    cabs: () => api.get('/cabs').then((r) => setCabs(r.items)),
    serviceLocations: () => api.get('/services').then((r) => setServiceLocations(r.items)),
    activities: () => api.get('/activities').then((r) => setActivities(r.items)),
    packageTemplates: () => api.get('/templates').then((r) => setPackageTemplates(r.items)),
    templates: () => api.get('/itinerary-templates').then((r) => setTemplates(r.items)),
    inclusions: () => api.get('/inclusions').then((r) => setInclusionPresets({ byDest: r.byDest || {} })),
    clients: () => api.get('/clients').then((r) => setClients(r.items)),
    packages: () => api.get('/packages').then((r) => setPackages(r.items)),
    bookings: () => api.get('/bookings').then((r) => setBookings(r.items)),
    invoices: () => api.get('/invoices').then((r) => setInvoices(r.items)),
    quotations: () => api.get('/quotations').then((r) => setQuotations(r.items)),
    vouchers: () => api.get('/vouchers').then((r) => setVouchers(r.items)),
    gallery: () => api.get('/stories').then((r) => setGallery(r.items)),
    users: () => api.get('/users').then((r) => setUsers(r.items)),
    roles: () => api.get('/roles').then((r) => setRoles(r.items)),
    assignment: () => api.get('/assignment').then((r) => setAssignment(r)),
    landing: () => api.get('/landing').then((r) => setLanding(r)),
    dashboard: () => api.get('/dashboard').then((r) => setDashboard({ series: r.series, recentActivity: r.recentActivity, analytics: r.analytics, kpis: r.kpis })),
  }
  const reload = (...names) => Promise.all(names.map((n) => LOADERS[n]?.()))

  /* ---------- bootstrap ---------- */
  const bootstrap = useCallback(async () => {
    const [me, ag, cfg, ent] = await Promise.all([api.get('/auth/me'), api.get('/agency'), api.get('/config'), api.get('/agency/features')])
    setSession(me)
    setAgencyState(normalizeAgency(ag.agency))
    setCurrentUserId(me.user.id)
    // admin-controlled plan feature flags (gate the whole UI)
    setFeatures(ent.features || {})
    setLimitsMap(ent.limits || {})
    // platform config from the backend
    setCategoryGroups(cfg.categoryGroups || [])
    setThemes(cfg.previewThemes || [])
    setPlans(cfg.plans || [])
    await Promise.all(Object.values(LOADERS).map((fn) => fn().catch(() => {})))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let alive = true
    ;(async () => {
      if (!isAuthed()) { setReady(true); return }
      try { await bootstrap(); if (alive) setAuthed(true) }
      catch { setToken(''); if (alive) setAuthed(false) }
      finally { if (alive) setReady(true) }
    })()
    return () => { alive = false }
  }, [bootstrap])

  async function login(email, password, opts = {}) {
    const data = await api.login(email, password, opts)
    await bootstrap()
    setAuthed(true)
    return data
  }
  function logout() {
    api.logout(); setAuthed(false); setSession(null)
    setAgencyState(null); setFeatures({}); setLimitsMap({})
    setClients([]); setPackages([]); setBookings([]); setInvoices([]); setQuotations([])
    setVouchers([]); setGallery([]); setUsers([]); setRoles([])
  }

  /* ---------- helpers ---------- */
  const replace = (setter) => (rec) => setter((l) => l.map((x) => (x.id === rec.id ? rec : x)))
  const prepend = (setter) => (rec) => setter((l) => [rec, ...l])

  /* ---------- agency profile ---------- */
  const setAgency = async (patch) => {
    const body = typeof patch === 'function' ? patch(agency) : patch
    const updated = await api.patch('/agency', body)
    setAgencyState(normalizeAgency(updated))
  }
  const respondRenewal = async (answer) => { setAgencyState(normalizeAgency(await api.post('/agency/renewal/respond', { answer }))) }

  /* ---------- master data ---------- */
  const addDestination = async (d) => { const rec = await api.post('/destinations', d); prepend(setDestinations)(rec); return rec }
  const updateDestination = async (id, patch) => replace(setDestinations)(await api.patch(`/destinations/${id}`, patch))
  const addHotel = async (h) => { const rec = await api.post('/hotels', h); prepend(setHotels)(rec); return rec }
  const updateHotel = async (id, patch) => replace(setHotels)(await api.patch(`/hotels/${id}`, patch))
  const addCab = async (c) => { const rec = await api.post('/cabs', c); prepend(setCabs)(rec); return rec }
  const updateCab = async (id, patch) => replace(setCabs)(await api.patch(`/cabs/${id}`, patch))
  const removeCab = async (id) => { await api.del(`/cabs/${id}`); setCabs((l) => l.filter((c) => c.id !== id)) }
  const addServiceLocation = async (s) => { const rec = await api.post('/services', s); prepend(setServiceLocations)(rec); return rec }
  const updateServiceLocation = async (id, patch) => replace(setServiceLocations)(await api.patch(`/services/${id}`, patch))
  const addActivity = async (a) => { const rec = await api.post('/activities', a); prepend(setActivities)(rec); return rec }
  const updateActivity = async (id, patch) => replace(setActivities)(await api.patch(`/activities/${id}`, patch))

  /* ---------- inclusion / exclusion presets ---------- */
  const presetsForDest = (dest) => (dest && inclusionPresets.byDest?.[dest]) || { inclusions: [], exclusions: [] }
  const addInclusionPreset = async (dest, type, text) => { const r = await api.post('/inclusions', { dest, type, text }); setInclusionPresets({ byDest: r.byDest }) }
  const removeInclusionPreset = async (dest, type, text) => { const r = await api.del('/inclusions', { dest, type, text }); setInclusionPresets({ byDest: r.byDest }) }
  const updateInclusionPreset = async (dest, type, oldText, newText) => { const r = await api.patch('/inclusions', { dest, type, oldText, newText }); setInclusionPresets({ byDest: r.byDest }) }
  const clearDestinationPresets = async (dest) => { const r = await api.del('/inclusions', { dest }); setInclusionPresets({ byDest: r.byDest }) }

  /* ---------- clients / leads ---------- */
  const addClient = async (c) => { const rec = await api.post('/clients', c); prepend(setClients)(rec); return rec }
  const updateClient = async (id, patch) => replace(setClients)(await api.patch(`/clients/${id}`, patch))
  const addClientDoc = async (clientId, doc) => replace(setClients)(await api.post(`/clients/${clientId}/docs`, doc))
  const removeClientDoc = async (clientId, docId) => replace(setClients)(await api.del(`/clients/${clientId}/docs/${docId}`))

  /* ---------- packages ---------- */
  const addPackage = async (p) => { const rec = await api.post('/packages', p); prepend(setPackages)(rec); reload('quotations'); return rec }
  const updatePackage = async (id, patch) => { const rec = await api.patch(`/packages/${id}`, patch); replace(setPackages)(rec); return rec }
  const setPackageStatus = async (id, status) => { const rec = await api.patch(`/packages/${id}/status`, { status }); replace(setPackages)(rec); reload('quotations') }
  const addPackageLog = async (id, text) => replace(setPackages)(await api.post(`/packages/${id}/logs`, { text }))
  const createPackageFromTemplate = async (tpl, client) => {
    const rec = await api.post('/packages/from-template', { templateId: tpl.id, clientId: client?.id })
    prepend(setPackages)(rec); reload('quotations', 'packageTemplates'); return rec
  }
  const addItineraryTemplate = async (tpl) => { const rec = await api.post('/itinerary-templates', tpl); prepend(setTemplates)(rec); return rec }
  const updateItineraryTemplate = async (id, patch) => replace(setTemplates)(await api.patch(`/itinerary-templates/${id}`, patch))
  const removeItineraryTemplate = async (id) => { await api.del(`/itinerary-templates/${id}`); setTemplates((l) => l.filter((t) => t.id !== id)) }

  /* ---------- bookings ---------- */
  const createBookingFromPackage = async (pkg) => {
    const booking = await api.post('/bookings/from-package', { packageId: pkg.id })
    await reload('bookings', 'invoices', 'quotations', 'packages', 'clients')
    return booking
  }
  const cancelBooking = async (id) => { await api.post(`/bookings/${id}/cancel`); await reload('bookings', 'invoices', 'quotations', 'packages') }
  const addBookingPayment = async (id, pay) => replace(setBookings)(await api.post(`/bookings/${id}/payments`, pay))
  const setBookingStatus = async (id, status) => replace(setBookings)(await api.patch(`/bookings/${id}/status`, { status }))

  /* ---------- invoices ---------- */
  const addInvoice = async (inv) => { const rec = await api.post('/invoices', inv); prepend(setInvoices)(rec); return rec }
  const addPayment = async (invId, pay) => replace(setInvoices)(await api.post(`/invoices/${invId}/payments`, pay))

  /* ---------- quotations ---------- */
  const setQuotationStatus = async (id, status) => replace(setQuotations)(await api.patch(`/quotations/${id}/status`, { status }))

  /* ---------- vouchers ---------- */
  const addVoucher = async (v) => { const rec = await api.post('/vouchers', v); prepend(setVouchers)(rec); return rec }
  const removeVoucher = async (id) => { await api.del(`/vouchers/${id}`); setVouchers((l) => l.filter((v) => v.id !== id)) }

  /* ---------- gallery / stories ---------- */
  const approveStory = async (id) => replace(setGallery)(await api.patch(`/stories/${id}/approve`))
  const addStory = async (s) => { const rec = await api.post('/stories', s); prepend(setGallery)(rec); return rec }

  /* ---------- landing ---------- */
  const updateLanding = async (patch) => {
    setLanding((l) => ({ ...l, ...patch }))
    const saved = await api.patch('/landing', patch)
    setLanding(saved)
    return saved
  }

  /* ---------- roles ---------- */
  const addRole = async (name) => { const rec = await api.post('/roles', { name }); setRoles((l) => [...l, rec]); return rec }
  const removeRole = async (id) => { await api.del(`/roles/${id}`); setRoles((l) => l.filter((r) => r.id !== id)) }
  const setRolePerm = async (id, key, val) => replace(setRoles)(await api.patch(`/roles/${id}/perm`, { key, value: val }))

  /* ---------- assignment ---------- */
  const updateAssignment = async (patch) => { setAssignment((a) => ({ ...a, ...patch })); setAssignment(await api.patch('/assignment', patch)) }
  const addAssignRule = async () => { const cfg = await api.post('/assignment/rules', {}); setAssignment(cfg); return cfg.rules[cfg.rules.length - 1] }
  const updateAssignRule = async (id, patch) => setAssignment(await api.patch(`/assignment/rules/${id}`, patch))
  const removeAssignRule = async (id) => setAssignment(await api.del(`/assignment/rules/${id}`))

  /* ---------- users ---------- */
  const addUser = async (u) => { const rec = await api.post('/users', u); prepend(setUsers)(rec); return rec }
  const updateUser = async (id, patch) => {
    const prev = users.find((u) => u.id === id)
    const rec = await api.patch(`/users/${id}`, patch)
    replace(setUsers)(rec)
    if (patch.name && prev && patch.name !== prev.name) reload('clients', 'assignment')
  }
  const removeUser = async (id) => { await api.del(`/users/${id}`); setUsers((l) => l.filter((x) => x.id !== id)); reload('assignment') }

  /* ---------- themes (static demo) ---------- */
  const toggleTheme = (id, key) => setThemes((l) => l.map((t) => (t.id === id ? { ...t, [key]: !t[key] } : t)))

  /* ---------- current user + permission flags ---------- */
  const currentUser = users.find((u) => u.id === currentUserId) || session?.user || null
  const currentRole = roles.find((r) => r.name === currentUser?.role) || session?.role
  const isAdmin = currentUserId === session?.user?.id ? session?.isAdmin : !!currentRole?.system
  const canSeePricing = currentRole
    ? (currentRole.system || currentRole.perms?.viewPricing !== false)
    : (session?.canSeePricing ?? true)
  const setCurrentUser = (id) => setCurrentUserId(id)

  /* ---------- plan feature flags (admin-controlled) ----------
     hasFeature(key) → is this feature enabled for the agency? Unknown keys
     default to enabled so we never hide something the catalog doesn't cover. */
  const hasFeature = useCallback((key) => features[key] !== false, [features])
  const limitFor = useCallback((key) => (limitsMap[key] == null ? -1 : limitsMap[key]), [limitsMap])

  const value = {
    ready, authed, session, login, logout, sessionExpiresAt,
    features, limitsMap, hasFeature, limitFor,
    agency, setAgency, respondRenewal,
    destinations, addDestination, updateDestination,
    hotels, addHotel, updateHotel,
    cabs, addCab, updateCab, removeCab,
    serviceLocations, addServiceLocation, updateServiceLocation,
    activities, addActivity, updateActivity,
    clients, addClient, updateClient, addClientDoc, removeClientDoc,
    packages, addPackage, updatePackage, setPackageStatus, addPackageLog,
    packageTemplates, createPackageFromTemplate,
    bookings, createBookingFromPackage, cancelBooking, addBookingPayment, setBookingStatus,
    invoices, addInvoice, addPayment,
    quotations, setQuotationStatus,
    gallery, approveStory, addStory,
    users, addUser, updateUser, removeUser,
    currentUser, currentUserId, setCurrentUser, canSeePricing, isAdmin,
    templates, addItineraryTemplate, updateItineraryTemplate, removeItineraryTemplate, themes, toggleTheme,
    inclusionPresets, addInclusionPreset, removeInclusionPreset, updateInclusionPreset, clearDestinationPresets, presetsForDest, categoryGroups,
    vouchers, addVoucher, removeVoucher,
    landing, updateLanding,
    roles, addRole, removeRole, setRolePerm,
    assignment, updateAssignment, addAssignRule, updateAssignRule, removeAssignRule,
    dashboardSeries: dashboard.series, recentActivity: dashboard.recentActivity, plans,
    dashboardAnalytics: dashboard.analytics, dashboardKpis: dashboard.kpis,
    reload, publicApi,
    toast, toasts,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
