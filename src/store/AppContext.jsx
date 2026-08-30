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

/* ---- Currency (agency-level; INR default) ----
   `inr` is the money formatter the whole CRM imports — it follows the agency's
   configured currency so agencies working with international DMCs can run in
   USD/AED/etc. without touching any other screen. */
export const CURRENCIES = [
  { code: 'INR', symbol: '₹', locale: 'en-IN', label: 'Indian Rupee (₹)' },
  { code: 'USD', symbol: '$', locale: 'en-US', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', label: 'Euro (€)' },
  { code: 'GBP', symbol: '£', locale: 'en-GB', label: 'British Pound (£)' },
  { code: 'AED', symbol: 'AED ', locale: 'en-AE', label: 'UAE Dirham (AED)' },
  { code: 'SGD', symbol: 'S$', locale: 'en-SG', label: 'Singapore Dollar (S$)' },
  { code: 'THB', symbol: '฿', locale: 'en-IN', label: 'Thai Baht (฿)' },
  { code: 'VND', symbol: '₫', locale: 'en-IN', label: 'Vietnamese Dong (₫)' },
  { code: 'IDR', symbol: 'Rp ', locale: 'en-IN', label: 'Indonesian Rupiah (Rp)' },
  { code: 'LKR', symbol: 'Rs ', locale: 'en-IN', label: 'Sri Lankan Rupee (Rs)' },
  { code: 'MYR', symbol: 'RM ', locale: 'en-IN', label: 'Malaysian Ringgit (RM)' },
]
let ACTIVE_CURRENCY = CURRENCIES[0]
export const setActiveCurrency = (code) => {
  ACTIVE_CURRENCY = CURRENCIES.find((c) => c.code === code) || CURRENCIES[0]
}
export const activeCurrency = () => ACTIVE_CURRENCY

export const inr = (n) =>
  ACTIVE_CURRENCY.symbol + Number(n || 0).toLocaleString(ACTIVE_CURRENCY.locale, { maximumFractionDigits: 0 })

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
  setActiveCurrency(ag.currency || 'INR')   // every money label follows the agency currency
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
  const [cities, setCities] = useState([])
  const [cabs, setCabs] = useState([])
  const [serviceLocations, setServiceLocations] = useState([])
  const [activities, setActivities] = useState([])
  const [packageTemplates, setPackageTemplates] = useState([])
  const [inclusionPresets, setInclusionPresets] = useState({ byDest: {} })
  const [clients, setClients] = useState([])
  const [packages, setPackages] = useState([])
  const [bookings, setBookings] = useState([])
  const [invoices, setInvoices] = useState([])
  const [expenses, setExpenses] = useState([])   // money out — supplier payments
  const [quotations, setQuotations] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [gallery, setGallery] = useState([])
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [assignment, setAssignment] = useState({ enabled: true, rules: [], fallback: { mode: 'all', members: [], next: 0 } })
  const [landing, setLanding] = useState(null)
  const [dashboard, setDashboard] = useState(EMPTY_DASH)
  // ── follow-ups (the work queue) ──
  const [tasks, setTasks] = useState([])
  const [taskScope, setTaskScope] = useState('mine')      // 'mine' | 'team'
  const [taskSummary, setTaskSummary] = useState({ overdue: 0, today: 0, week: 0, total: 0, doneToday: 0, due: 0, next: [] })
  const [followupRules, setFollowupRules] = useState(null)

  // platform config (served from the backend via /config)
  const [categoryGroups, setCategoryGroups] = useState([])
  const [themes, setThemes] = useState([])
  const [templates, setTemplates] = useState([])
  const [plans, setPlans] = useState([])
  const [cabTypes, setCabTypes] = useState([])
  const [scheduleTemplate, setScheduleTemplate] = useState([])
  const [roleModules, setRoleModules] = useState([])

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
    cities: () => api.get('/cities').then((r) => setCities(r.items)),
    cabs: () => api.get('/cabs').then((r) => setCabs(r.items)),
    serviceLocations: () => api.get('/services').then((r) => setServiceLocations(r.items)),
    activities: () => api.get('/activities').then((r) => setActivities(r.items)),
    packageTemplates: () => api.get('/templates').then((r) => setPackageTemplates(r.items)),
    templates: () => api.get('/itinerary-templates').then((r) => setTemplates(r.items)),
    inclusions: () => api.get('/inclusions').then((r) => setInclusionPresets({ byDest: r.byDest || {} })),
    // a busy agency scans leads 100 at a time — pull a full working set, not the default page
    clients: () => api.get('/clients?limit=2000').then((r) => setClients(r.items)),
    packages: () => api.get('/packages').then((r) => setPackages(r.items)),
    bookings: () => api.get('/bookings').then((r) => setBookings(r.items)),
    invoices: () => api.get('/invoices').then((r) => setInvoices(r.items)),
    expenses: () => api.get('/expenses').then((r) => setExpenses(r.items)),
    quotations: () => api.get('/quotations').then((r) => setQuotations(r.items)),
    vouchers: () => api.get('/vouchers').then((r) => setVouchers(r.items)),
    gallery: () => api.get('/stories').then((r) => setGallery(r.items)),
    users: () => api.get('/users').then((r) => setUsers(r.items)),
    roles: () => api.get('/roles').then((r) => setRoles(r.items)),
    assignment: () => api.get('/assignment').then((r) => setAssignment(r)),
    landing: () => api.get('/landing').then((r) => setLanding(r)),
    tasks: () => api.get('/tasks').then((r) => { setTasks(r.items); setTaskScope(r.scope) }),
    taskSummary: () => api.get('/tasks/summary').then((r) => setTaskSummary(r)),
    dashboard: () => api.get('/dashboard').then((r) => setDashboard({ series: r.series, recentActivity: r.recentActivity, analytics: r.analytics, kpis: r.kpis })),
  }
  const reload = (...names) => Promise.all(names.map((n) => LOADERS[n]?.()))

  /* Which gate guards each loader — [featureKey, rolePermKey]. Bootstrap skips
     the ones the caller can't reach, so a restricted role doesn't fire a dozen
     requests the API is only going to refuse. */
  const LOADER_GATES = {
    destinations: ['master.destinations', 'master'],
    hotels: ['master.hotels', 'master'],
    cities: ['master.cities', 'master'],
    cabs: ['master.cabs', 'master'],
    serviceLocations: ['master.service_locations', 'master'],
    activities: ['master.activities', 'master'],
    packageTemplates: [null, 'builder'],
    templates: [null, 'builder'],
    inclusions: ['master.inclusions', 'master'],
    clients: ['crm.view', 'clients'],
    packages: ['builder.access', 'builder'],
    bookings: ['bookings.view', 'bookings'],
    invoices: ['invoices.view', 'invoices'],
    expenses: ['invoices.view', 'invoices'],
    quotations: ['quotations.view', 'builder'],
    vouchers: ['vouchers.view', 'vouchers'],
    gallery: ['reviews.view', null],
    assignment: ['team.lead_assignment', 'settings'],
    landing: ['landing.builder', 'landing'],
    dashboard: ['dashboard.view', 'dashboard'],
    tasks: ['tasks.view', 'tasks'],
    taskSummary: ['tasks.view', 'tasks'],
  }

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
    setCabTypes(cfg.cabTypes || [])
    setScheduleTemplate(cfg.paymentScheduleTemplate || [])
    setRoleModules(cfg.roleModules || [])

    // only fetch what this plan and this role actually allow
    const featureMap = ent.features || {}
    const permsMap = me.perms || {}
    const allowed = ([feature, perm]) =>
      (!feature || featureMap[feature] === true) && (!perm || permsMap[perm] === true)
    await Promise.all(Object.entries(LOADERS)
      .filter(([name]) => !LOADER_GATES[name] || allowed(LOADER_GATES[name]))
      .map(([, fn]) => fn().catch(() => {})))
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
    setCities([])
    setClients([]); setPackages([]); setBookings([]); setInvoices([]); setExpenses([]); setQuotations([])
    setVouchers([]); setGallery([]); setUsers([]); setRoles([])
    setTasks([]); setTaskSummary({ overdue: 0, today: 0, week: 0, total: 0, doneToday: 0, due: 0, next: [] })
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
  const removeDestination = async (id) => { await api.del(`/destinations/${id}`); setDestinations((l) => l.filter((d) => d.id !== id)) }
  const addCity = async (c) => { const rec = await api.post('/cities', c); setCities((l) => [...l, rec].sort((a, b) => a.name.localeCompare(b.name))); return rec }
  const updateCity = async (id, patch) => replace(setCities)(await api.patch(`/cities/${id}`, patch))
  const removeCity = async (id) => { await api.del(`/cities/${id}`); setCities((l) => l.filter((c) => c.id !== id)) }
  const addHotel = async (h) => { const rec = await api.post('/hotels', h); prepend(setHotels)(rec); return rec }
  const updateHotel = async (id, patch) => replace(setHotels)(await api.patch(`/hotels/${id}`, patch))
  const removeHotel = async (id) => { await api.del(`/hotels/${id}`); setHotels((l) => l.filter((h) => h.id !== id)) }
  const addCab = async (c) => { const rec = await api.post('/cabs', c); prepend(setCabs)(rec); return rec }
  const updateCab = async (id, patch) => replace(setCabs)(await api.patch(`/cabs/${id}`, patch))
  const removeCab = async (id) => { await api.del(`/cabs/${id}`); setCabs((l) => l.filter((c) => c.id !== id)) }
  const addServiceLocation = async (s) => { const rec = await api.post('/services', s); prepend(setServiceLocations)(rec); return rec }
  const updateServiceLocation = async (id, patch) => replace(setServiceLocations)(await api.patch(`/services/${id}`, patch))
  const removeServiceLocation = async (id) => { await api.del(`/services/${id}`); setServiceLocations((l) => l.filter((s) => s.id !== id)) }
  const addActivity = async (a) => { const rec = await api.post('/activities', a); prepend(setActivities)(rec); return rec }
  const updateActivity = async (id, patch) => replace(setActivities)(await api.patch(`/activities/${id}`, patch))
  const removeActivity = async (id) => { await api.del(`/activities/${id}`); setActivities((l) => l.filter((a) => a.id !== id)) }

  /* ---------- inclusion / exclusion presets ---------- */
  const presetsForDest = (dest) => (dest && inclusionPresets.byDest?.[dest]) || { inclusions: [], exclusions: [] }
  const addInclusionPreset = async (dest, type, text) => { const r = await api.post('/inclusions', { dest, type, text }); setInclusionPresets({ byDest: r.byDest }) }
  const removeInclusionPreset = async (dest, type, text) => { const r = await api.del('/inclusions', { dest, type, text }); setInclusionPresets({ byDest: r.byDest }) }
  const updateInclusionPreset = async (dest, type, oldText, newText) => { const r = await api.patch('/inclusions', { dest, type, oldText, newText }); setInclusionPresets({ byDest: r.byDest }) }
  const clearDestinationPresets = async (dest) => { const r = await api.del('/inclusions', { dest }); setInclusionPresets({ byDest: r.byDest }) }

  /* ---------- clients / leads ---------- */
  const addClient = async (c) => { const rec = await api.post('/clients', c); prepend(setClients)(rec); return rec }
  const updateClient = async (id, patch) => replace(setClients)(await api.patch(`/clients/${id}`, patch))
  const removeClient = async (id) => { await api.del(`/clients/${id}`); setClients((l) => l.filter((c) => c.id !== id)) }
  const addClientDoc = async (clientId, doc) => replace(setClients)(await api.post(`/clients/${clientId}/docs`, doc))
  const removeClientDoc = async (clientId, docId) => replace(setClients)(await api.del(`/clients/${clientId}/docs/${docId}`))

  /* ---------- packages ---------- */
  const addPackage = async (p) => { const rec = await api.post('/packages', p); prepend(setPackages)(rec); reload('quotations'); return rec }
  const updatePackage = async (id, patch) => { const rec = await api.patch(`/packages/${id}`, patch); replace(setPackages)(rec); return rec }
  const removePackage = async (id) => { await api.del(`/packages/${id}`); setPackages((l) => l.filter((p) => p.id !== id)); reload('quotations', 'bookings', 'invoices') }
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
  const removeBooking = async (id) => { await api.del(`/bookings/${id}`); setBookings((l) => l.filter((b) => b.id !== id)); await reload('invoices', 'quotations', 'packages') }
  const addBookingPayment = async (id, pay) => {
    replace(setBookings)(await api.post(`/bookings/${id}/payments`, pay))
    // the payment also landed on the booking's invoice (single pipeline) —
    // refresh the invoice list so its status/balance is current everywhere
    try { const r = await api.get('/invoices'); setInvoices(r.items) } catch { /* list refreshes on next load */ }
  }
  const setBookingStatus = async (id, status) => replace(setBookings)(await api.patch(`/bookings/${id}/status`, { status }))
  const setBookingSchedule = async (id, schedule) => replace(setBookings)(await api.patch(`/bookings/${id}/schedule`, { schedule }))
  const generateBookingSchedule = async (id) => replace(setBookings)(await api.post(`/bookings/${id}/schedule/generate`, {}))

  /* ---------- invoices ---------- */
  const addInvoice = async (inv) => { const rec = await api.post('/invoices', inv); prepend(setInvoices)(rec); return rec }
  const addPayment = async (invId, pay) => {
    replace(setInvoices)(await api.post(`/invoices/${invId}/payments`, pay))
    // mirrored onto the linked booking's collection — refresh it too
    try { const r = await api.get('/bookings'); setBookings(r.items) } catch { /* refreshes on next load */ }
  }
  const removeInvoice = async (id) => { await api.del(`/invoices/${id}`); setInvoices((l) => l.filter((i) => i.id !== id)) }

  /* ---------- expenses (money out — supplier payments) ---------- */
  const addExpense = async (e) => { const rec = await api.post('/expenses', e); prepend(setExpenses)(rec); return rec }
  const updateExpense = async (id, patch) => replace(setExpenses)(await api.patch(`/expenses/${id}`, patch))
  const removeExpense = async (id) => { await api.del(`/expenses/${id}`); setExpenses((l) => l.filter((e) => e.id !== id)) }

  /* ---------- quotations ---------- */
  const setQuotationStatus = async (id, status) => replace(setQuotations)(await api.patch(`/quotations/${id}/status`, { status }))
  const removeQuotation = async (id) => { await api.del(`/quotations/${id}`); setQuotations((l) => l.filter((q) => q.id !== id)) }

  /* ---------- vouchers ---------- */
  const addVoucher = async (v) => { const rec = await api.post('/vouchers', v); prepend(setVouchers)(rec); return rec }
  const removeVoucher = async (id) => { await api.del(`/vouchers/${id}`); setVouchers((l) => l.filter((v) => v.id !== id)) }

  /* ---------- follow-ups ---------- */
  // Every mutation refreshes the summary too — the bell, the nav badge and the
  // dashboard card all read it, so they can never drift from the queue.
  const refreshTaskSummary = async () => { try { setTaskSummary(await api.get('/tasks/summary')) } catch { /* gated */ } }
  const reloadTasks = async () => { await reload('tasks'); await refreshTaskSummary() }
  const addTask = async (t) => { const rec = await api.post('/tasks', t); prepend(setTasks)(rec); refreshTaskSummary(); return rec }
  const updateTask = async (id, patch) => { const rec = await api.patch(`/tasks/${id}`, patch); replace(setTasks)(rec); refreshTaskSummary(); return rec }
  const completeTask = async (id, outcome) => { const rec = await api.post(`/tasks/${id}/complete`, { outcome }); replace(setTasks)(rec); refreshTaskSummary(); return rec }
  const reopenTask = async (id) => { const rec = await api.post(`/tasks/${id}/reopen`); replace(setTasks)(rec); refreshTaskSummary(); return rec }
  const snoozeTask = async (id, opts) => { const rec = await api.post(`/tasks/${id}/snooze`, opts); replace(setTasks)(rec); refreshTaskSummary(); return rec }
  const removeTask = async (id) => { await api.del(`/tasks/${id}`); setTasks((l) => l.filter((t) => t.id !== id)); refreshTaskSummary() }
  const loadFollowupRules = async () => { const r = await api.get('/tasks/rules'); setFollowupRules(r); return r }
  const setFollowupRule = async (key, patch) => {
    const r = await api.patch('/tasks/rules', { key, ...patch })
    setFollowupRules((f) => (f ? { ...f, ...r } : f))
    return r
  }
  /** The open follow-ups attached to one record — powers the per-record panel. */
  const tasksFor = (kind, id) => tasks.filter((t) => t.link?.kind === kind && String(t.link?.id) === String(id))

  /* ---------- gallery / stories ---------- */
  const approveStory = async (id) => replace(setGallery)(await api.patch(`/stories/${id}/approve`))
  const addStory = async (s) => { const rec = await api.post('/stories', s); prepend(setGallery)(rec); return rec }
  const removeStory = async (id) => { await api.del(`/stories/${id}`); setGallery((l) => l.filter((g) => g.id !== id)) }

  /* ---------- landing ---------- */
  const updateLanding = async (patch) => {
    setLanding((l) => ({ ...l, ...patch }))
    const saved = await api.patch('/landing', patch)
    setLanding(saved)
    return saved
  }

  /* ---------- assignment ---------- */
  const updateAssignment = async (patch) => { setAssignment((a) => ({ ...a, ...patch })); setAssignment(await api.patch('/assignment', patch)) }
  const addAssignRule = async () => { const cfg = await api.post('/assignment/rules', {}); setAssignment(cfg); return cfg.rules[cfg.rules.length - 1] }
  const updateAssignRule = async (id, patch) => setAssignment(await api.patch(`/assignment/rules/${id}`, patch))
  const removeAssignRule = async (id) => setAssignment(await api.del(`/assignment/rules/${id}`))

  /* ---------- themes (static demo) ---------- */
  const toggleTheme = (id, key) => setThemes((l) => l.map((t) => (t.id === id ? { ...t, [key]: !t[key] } : t)))

  /* ---------- current user + permission flags ---------- */
  const currentUser = users.find((u) => u.id === currentUserId) || session?.user || null
  // case-insensitive — a user saved with role "operations" must still resolve
  // the "Operations" role instead of silently falling through to admin-ish defaults
  const currentRole = roles.find((r) => String(r.name).toLowerCase() === String(currentUser?.role || '').toLowerCase()) || session?.role
  const isAdmin = currentUserId === session?.user?.id ? session?.isAdmin : !!currentRole?.system
  const canSeePricing = currentRole
    ? (currentRole.system || currentRole.perms?.viewPricing !== false)
    : (session?.canSeePricing ?? true)
  const setCurrentUser = (id) => setCurrentUserId(id)

  /* ---------- role permissions (the second gate) ----------
     `can(moduleKey)` answers "is this TEAMMATE allowed?", while `hasFeature`
     answers "is the AGENCY's plan entitled?". Both have to be true, and both
     are enforced again server-side — this only keeps the UI honest.
     The map is resolved by the backend and travels on the session, so the CRM
     never re-implements the rule. */
  const sessionPerms = session?.perms || null
  const viewingSelf = currentUserId === session?.user?.id
  const can = useCallback((moduleKey) => {
    if (!moduleKey) return true
    // "view as" preview: read the previewed role's own resolved map
    if (!viewingSelf) return currentRole?.access ? currentRole.access[moduleKey] !== false : !!currentRole?.system
    if (!sessionPerms) return true          // pre-bootstrap: don't flash a false denial
    return sessionPerms[moduleKey] !== false
  }, [sessionPerms, viewingSelf, currentRole])

  /* ---------- plan feature flags (admin-controlled) ----------
     hasFeature(key) → is this feature explicitly enabled for the agency.
     Missing keys fail closed, matching the backend gatekeeper. */
  const hasFeature = useCallback((key) => features[key] === true, [features])
  const limitFor = useCallback((key) => (limitsMap[key] == null ? 0 : limitsMap[key]), [limitsMap])

  const value = {
    ready, authed, session, login, logout, sessionExpiresAt,
    features, limitsMap, hasFeature, limitFor, can, roleModules,
    agency, setAgency, respondRenewal,
    destinations, addDestination, updateDestination, removeDestination,
    hotels, addHotel, updateHotel, removeHotel,
    cities, addCity, updateCity, removeCity,
    cabTypes, scheduleTemplate,
    cabs, addCab, updateCab, removeCab,
    serviceLocations, addServiceLocation, updateServiceLocation, removeServiceLocation,
    activities, addActivity, updateActivity, removeActivity,
    clients, addClient, updateClient, removeClient, addClientDoc, removeClientDoc,
    packages, addPackage, updatePackage, removePackage, setPackageStatus, addPackageLog,
    packageTemplates, createPackageFromTemplate,
    bookings, createBookingFromPackage, cancelBooking, removeBooking, addBookingPayment, setBookingStatus,
    setBookingSchedule, generateBookingSchedule,
    invoices, addInvoice, addPayment, removeInvoice,
    expenses, addExpense, updateExpense, removeExpense,
    quotations, setQuotationStatus, removeQuotation,
    tasks, taskScope, taskSummary, tasksFor, reloadTasks, addTask, updateTask,
    completeTask, reopenTask, snoozeTask, removeTask,
    followupRules, loadFollowupRules, setFollowupRule,
    gallery, approveStory, addStory, removeStory,
    users, // read-only — the Wandra team manages users (paid seats) from the admin panel
    currentUser, currentUserId, setCurrentUser, canSeePricing, isAdmin,
    templates, addItineraryTemplate, updateItineraryTemplate, removeItineraryTemplate, themes, toggleTheme,
    inclusionPresets, addInclusionPreset, removeInclusionPreset, updateInclusionPreset, clearDestinationPresets, presetsForDest, categoryGroups,
    vouchers, addVoucher, removeVoucher,
    landing, updateLanding,
    roles, // read-only — the Wandra team manages roles from the admin panel
    assignment, updateAssignment, addAssignRule, updateAssignRule, removeAssignRule,
    dashboardSeries: dashboard.series, recentActivity: dashboard.recentActivity, plans,
    dashboardAnalytics: dashboard.analytics, dashboardKpis: dashboard.kpis,
    reload, publicApi,
    toast, toasts,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
