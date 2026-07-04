import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as seed from '../data/mockData'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

let idc = 1000
const nid = (p) => `${p}${++idc}`

/* ---- persistence: keep entity data across tabs/reloads so public
   pages (/i, /pdf, /inv) opened in a NEW document can find records ---- */
const LS_KEY = 'wandra-data-v5' // v5: Kerala destination + lead-assignment rules; v4: cab ratePerDay+image, service-location cost/sell
const stored = (() => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null') } catch { return null }
})()
if (stored) {
  // keep freshly generated ids clear of every persisted id
  const nums = (JSON.stringify(stored).match(/"id"\s*:\s*"[a-z]+(\d+)"/g) || []).map((s) => Number(s.replace(/\D/g, '')) || 0)
  idc = Math.max(idc, ...nums, 0)
}

// ---- Pricing engine (mirrors the demo's auto-calc) ----
export function computePricing(pkg) {
  // Builder mode: totals are computed and stored by the QuoteBuilder (cost vs selling per line)
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
  // profit = selling - buying (hotel net + cab cost approximated by rate)
  const hotelNet = (pkg.hotelsAlloc || []).reduce((s, h) => s + (Number(h.net) || 0), 0)
  const componentsCost = hotelNet + cabTotal
  const profit = grandTotal - componentsCost - otherTotal
  return { cabTotal, hotelTotal, otherTotal, subtotal, discount, gstPercent, gstAmount, grandTotal, componentsCost, profit }
}

export const inr = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })

// sentinel: "let the assignment rules decide" (used by the New Query form)
export const AUTO_ASSIGNEE = '__auto__'

export function AppProvider({ children }) {
  // merged over seed so older saves gain new fields (e.g. logo);
  // plan always comes from seed — it's product config, not a user edit
  const [agency, setAgency] = useState(stored?.agency ? { ...seed.agency, ...stored.agency, plan: seed.agency.plan, bank: { ...seed.agency.bank, ...(stored.agency.bank || {}) } } : seed.agency)
  const [destinations, setDestinations] = useState(stored?.destinations || seed.destinations)
  const [hotels, setHotels] = useState(stored?.hotels || seed.hotels)
  const [cabs, setCabs] = useState(stored?.cabs || seed.cabs)
  const [serviceLocations, setServiceLocations] = useState(stored?.serviceLocations || seed.serviceLocations)
  const [activities, setActivities] = useState(stored?.activities || seed.activities)
  const [inclusionPresets, setInclusionPresets] = useState(stored?.inclusionPresets || seed.inclusionPresets)
  const [vouchers, setVouchers] = useState(stored?.vouchers || [])
  // merge over defaults so configs saved before new sections (e.g. header) pick them up
  const [landing, setLanding] = useState(stored?.landing ? { ...seed.landingDefault, ...stored.landing } : seed.landingDefault)
  const [roles, setRoles] = useState(stored?.roles || seed.rolesDefault)
  const [assignment, setAssignment] = useState(stored?.assignment ? { ...seed.assignmentDefault, ...stored.assignment } : seed.assignmentDefault)
  const [clients, setClients] = useState(stored?.clients || seed.clients)
  const [packages, setPackages] = useState(stored?.packages || seed.packages)
  const [bookings, setBookings] = useState(stored?.bookings || seed.bookings)
  const [invoices, setInvoices] = useState(stored?.invoices || seed.invoices)
  const [quotations, setQuotations] = useState(stored?.quotations || seed.quotations)
  const [gallery, setGallery] = useState(seed.galleryStories)
  const [users, setUsers] = useState(stored?.users || seed.users)
  const [templates] = useState(seed.itineraryTemplates)
  const [packageTemplates, setPackageTemplates] = useState(seed.packageTemplates)
  const [themes, setThemes] = useState(seed.previewThemes)
  const [toasts, setToasts] = useState([])

  // persist entity data so fresh documents (new tab / print preview iframe) see it
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ agency, users, destinations, hotels, cabs, serviceLocations, activities, inclusionPresets, vouchers, landing, roles, assignment, clients, packages, bookings, invoices, quotations }))
    } catch { /* storage full/unavailable — app still works in-memory */ }
  }, [agency, users, destinations, hotels, cabs, serviceLocations, activities, inclusionPresets, vouchers, landing, roles, assignment, clients, packages, bookings, invoices, quotations])

  // cross-tab sync: when another document writes (e.g. a lead submitted on the
  // public landing page in its own tab), pull the fresh data into this tab's state
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== LS_KEY || !e.newValue) return
      try {
        const d = JSON.parse(e.newValue)
        if (d.clients) setClients(d.clients)
        if (d.packages) setPackages(d.packages)
        if (d.bookings) setBookings(d.bookings)
        if (d.invoices) setInvoices(d.invoices)
        if (d.quotations) setQuotations(d.quotations)
        if (d.vouchers) setVouchers(d.vouchers)
        if (d.landing) setLanding((prev) => ({ ...prev, ...d.landing }))
        if (d.assignment) setAssignment((prev) => ({ ...prev, ...d.assignment }))
        if (d.agency) setAgency((prev) => ({ ...prev, ...d.agency }))
        if (d.users) setUsers(d.users)
      } catch { /* ignore malformed writes */ }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const toast = useCallback((msg) => {
    const id = nid('t')
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  // ---- lead assignment: conditional rules + round robin ----
  // First enabled rule whose condition matches wins; its members take turns.
  // Rotation pointers (rule.next / fallback.next) persist so the robin survives reloads.
  const runAssignment = (draft) => {
    if (!assignment.enabled) return { assignee: '', via: '' }
    const activeNames = users.filter((u) => u.status === 'Active').map((u) => u.name)
    const hay = {
      destination: (draft.interest || '').toLowerCase(),
      source: (draft.source || '').toLowerCase(),
      city: (draft.city || '').toLowerCase(),
    }
    for (const r of assignment.rules) {
      if (!r.enabled || !r.values?.length || !r.members?.length) continue
      if (!r.values.some((v) => (hay[r.field] || '').includes(v.toLowerCase()))) continue
      const pool = r.members.filter((m) => activeNames.includes(m))
      if (!pool.length) continue
      const name = pool[(r.next || 0) % pool.length]
      setAssignment((s) => ({ ...s, rules: s.rules.map((x) => (x.id === r.id ? { ...x, next: ((x.next || 0) + 1) % pool.length } : x)) }))
      return { assignee: name, via: r.name }
    }
    const fb = assignment.fallback || { mode: 'all' }
    if (fb.mode === 'unassigned') return { assignee: '', via: '' }
    const pool = (fb.mode === 'members' && fb.members?.length ? fb.members : activeNames).filter((m) => activeNames.includes(m))
    if (!pool.length) return { assignee: '', via: '' }
    const name = pool[(fb.next || 0) % pool.length]
    setAssignment((s) => ({ ...s, fallback: { ...s.fallback, next: ((s.fallback?.next || 0) + 1) % pool.length } }))
    return { assignee: name, via: 'Round robin' }
  }
  const updateAssignment = (patch) => setAssignment((a) => ({ ...a, ...patch }))
  const addAssignRule = () => {
    const rec = { id: nid('ar'), name: 'New rule', enabled: true, field: 'destination', values: [], members: [], next: 0 }
    setAssignment((a) => ({ ...a, rules: [...a.rules, rec] }))
    return rec
  }
  const updateAssignRule = (id, patch) => setAssignment((a) => ({ ...a, rules: a.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
  const removeAssignRule = (id) => setAssignment((a) => ({ ...a, rules: a.rules.filter((r) => r.id !== id) }))

  // ---- generic add/update/remove factories ----
  const addClient = (c) => {
    const code = `CLI-202602-${String(clients.length + 1).padStart(3, '0')}`
    const rec = { id: nid('cl'), code, tripStatus: 'New Query', createdAt: '2026-06-26', ...c }
    const q = rec.query || {}
    if (!q.assignee || q.assignee === AUTO_ASSIGNEE) {
      const { assignee, via } = runAssignment(rec)
      rec.query = { ...q, assignee, assignedVia: via }
    }
    setClients((l) => [rec, ...l])
    return rec
  }
  const addClientDoc = (clientId, doc) => setClients((l) => l.map((c) => (c.id === clientId ? { ...c, docs: [{ id: nid('doc'), uploadedAt: new Date().toISOString().slice(0, 10), ...doc }, ...(c.docs || [])] } : c)))
  const removeClientDoc = (clientId, docId) => setClients((l) => l.map((c) => (c.id === clientId ? { ...c, docs: (c.docs || []).filter((d) => d.id !== docId) } : c)))
  const addDestination = (d) => setDestinations((l) => [{ id: nid('d'), ...d }, ...l])
  const addHotel = (h) => setHotels((l) => [{ id: nid('h'), ...h }, ...l])
  const addCab = (c) => setCabs((l) => [{ id: nid('c'), status: 'Active', ...c }, ...l])
  const updateClient = (id, patch) => setClients((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const updateDestination = (id, patch) => setDestinations((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const updateHotel = (id, patch) => setHotels((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const updateCab = (id, patch) => setCabs((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const addServiceLocation = (s) => setServiceLocations((l) => [{ id: nid('sl'), ...s }, ...l])
  const updateServiceLocation = (id, patch) => setServiceLocations((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const addActivity = (a) => setActivities((l) => [{ id: nid('ac'), ...a }, ...l])
  const updateActivity = (id, patch) => setActivities((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  // type: 'inclusions' | 'exclusions'
  const addInclusionPreset = (type, text) => setInclusionPresets((p) => (p[type].includes(text) ? p : { ...p, [type]: [...p[type], text] }))
  const removeInclusionPreset = (type, text) => setInclusionPresets((p) => ({ ...p, [type]: p[type].filter((x) => x !== text) }))
  // vouchers: { type: 'Hotel'|'Transport'|'Activity', clientId, clientName, packageId, title, fields: [{k,v}], notes }
  const updateLanding = (patch) => setLanding((l) => ({ ...l, ...patch }))
  const addRole = (name) => { const rec = { id: nid('r'), name, perms: { dashboard: true, clients: true } }; setRoles((l) => [...l, rec]); return rec }
  const removeRole = (id) => setRoles((l) => l.filter((r) => r.id !== id || r.system))
  const setRolePerm = (id, key, val) => setRoles((l) => l.map((r) => (r.id === id && !r.system ? { ...r, perms: { ...r.perms, [key]: val } } : r)))
  const addVoucher = (v) => {
    const rec = { id: nid('v'), code: `VCH-${String(vouchers.length + 1).padStart(4, '0')}`, createdAt: '2026-06-26', ...v }
    setVouchers((l) => [rec, ...l]); return rec
  }
  const removeVoucher = (id) => setVouchers((l) => l.filter((v) => v.id !== id))

  const addPackage = (p) => {
    const seq = String(packages.length + 4).padStart(4, '0')
    const rec = { id: nid('pk'), code: `PKG-202606-${seq}`, createdAt: '2026-06-26', createdBy: agency.name, paid: 0, status: p.status || 'Draft', ...p }
    setPackages((l) => [rec, ...l])
    // auto-create a quotation entry
    const pr = computePricing(rec)
    setQuotations((q) => [{ id: nid('q'), packageId: rec.id, packageCode: rec.code, client: rec.clientName, travelDate: rec.startDate, phone: '', email: '', status: 'Draft', amount: pr.grandTotal }, ...q])
    return rec
  }
  const updatePackage = (id, patch) => setPackages((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const createPackageFromTemplate = (tpl, client) => {
    const dest = seed.destinations.find((d) => d.name === tpl.destination)
    const rec = addPackage({
      clientId: client?.id || '', clientName: client?.name || '', clientPhone: client?.phone || '',
      clientEmail: client?.email || '', clientAddress: client?.address || '',
      fromLocation: '', route: '',
      destination: dest ? `${dest.name} - ${dest.location}` : tpl.destination,
      days: tpl.days, nights: tpl.nights, autoNights: false,
      startDate: client?.query?.startDate || '',
      pax: { total: (client?.query?.adults || 2) + (client?.query?.children || 0), adults: client?.query?.adults || 2, children: client?.query?.children || 0, childrenNoBed: 0, extraBeds: 0, rooms: Math.max(1, Math.ceil((client?.query?.adults || 2) / 2)), roomType: 'Double / Twin' },
      flightIncluded: false, flight: { airline: '', flightNo: '', depart: '', arrive: '' },
      status: 'Draft',
      cabs: (tpl.cabs || []).map((c) => ({ ...c })),
      hotelsAlloc: (tpl.hotelsAlloc || []).map((h) => ({ ...h })),
      itinerary: (tpl.itinerary || []).map((d) => ({ ...d, stops: (d.stops || []).map((s) => ({ ...s })) })),
      inclusions: [...seed.inclusionPresets.inclusions],
      exclusions: [...seed.inclusionPresets.exclusions],
      categories: (tpl.categories || []).map((c) => ({ ...c })),
      pricing: { ...tpl.pricing },
      fromTemplate: tpl.name,
    })
    setPackageTemplates((l) => l.map((t) => (t.id === tpl.id ? { ...t, usedCount: (t.usedCount || 0) + 1 } : t)))
    if (client) addPackageLog(rec.id, `Created from template “${tpl.name}”`)
    return rec
  }

  const addPackageLog = (id, text) => setPackages((l) => l.map((p) => (p.id === id ? { ...p, logs: [{ id: nid('lg'), text, at: '2026-06-26' }, ...(p.logs || [])] } : p)))
  const setPackageStatus = (id, status) => { updatePackage(id, { status }); addPackageLog(id, `Status changed to ${status}`); setQuotations((q) => q.map((x) => (x.packageId === id ? { ...x, status: status === 'Confirmed' ? 'Confirmed' : status === 'Cancelled' ? 'Cancelled' : 'Sent' } : x))) }

  const createBookingFromPackage = (pkg) => {
    const existing = bookings.find((b) => b.packageId === pkg.id && b.status !== 'Cancelled')
    if (existing) return existing
    const pr = computePricing(pkg)
    const seq = String(bookings.length + 3).padStart(4, '0')
    // auto-generate the invoice alongside the booking
    const destShort = (pkg.destination || '').split(' - ')[0]
    const inv = addInvoice({
      clientId: pkg.clientId || '', clientName: pkg.clientName, type: 'Booking',
      packageId: pkg.id, issueDate: '2026-06-26', dueDate: pkg.startDate || '', status: 'Unpaid', gst: false,
      items: [{ description: `Travel Package ${pkg.code} — ${destShort} (${pkg.nights}N/${pkg.days}D)`, qty: 1, rate: pr.grandTotal, tax: 0 }],
    })
    const rec = { id: nid('bk'), code: `BKG-202606-${seq}`, packageId: pkg.id, invoiceId: inv.id, clientName: pkg.clientName, travelDate: pkg.startDate, status: 'Active', value: pr.grandTotal, paid: pkg.paid || 0, payments: [] }
    setBookings((l) => [rec, ...l])
    setInvoices((l) => l.map((i) => (i.id === inv.id ? { ...i, bookingId: rec.id } : i)))
    setPackageStatus(pkg.id, 'Booked')
    setQuotations((l) => l.map((q) => (q.packageId === pkg.id ? { ...q, status: 'Confirmed' } : q)))
    addPackageLog(pkg.id, `Booking ${rec.code} created · Invoice ${inv.code} generated`)
    // booking confirmed → the client's trip pipeline moves to Converted automatically
    setClients((l) => l.map((c) => ((c.id === pkg.clientId || c.name === pkg.clientName) ? { ...c, tripStatus: 'Converted' } : c)))
    return rec
  }
  const cancelBooking = (id) => {
    const bk = bookings.find((b) => b.id === id)
    if (!bk) return
    setBookings((l) => l.map((b) => (b.id === id ? { ...b, status: 'Cancelled' } : b)))
    if (bk.invoiceId) setInvoices((l) => l.map((i) => (i.id === bk.invoiceId ? { ...i, status: 'Cancelled' } : i)))
    if (bk.packageId) {
      setPackageStatus(bk.packageId, 'Quoted')
      setQuotations((l) => l.map((q) => (q.packageId === bk.packageId ? { ...q, status: 'Sent' } : q)))
      addPackageLog(bk.packageId, `Booking ${bk.code} cancelled`)
    }
  }
  const addBookingPayment = (id, pay) => setBookings((l) => l.map((b) => (b.id === id ? { ...b, payments: [...(b.payments || []), pay], paid: (b.paid || 0) + Number(pay.amount || 0) } : b)))
  const setBookingStatus = (id, status) => setBookings((l) => l.map((b) => (b.id === id ? { ...b, status } : b)))
  const setQuotationStatus = (id, status) => setQuotations((l) => l.map((q) => (q.id === id ? { ...q, status } : q)))

  const addInvoice = (inv) => {
    const seq = String(invoices.length + 4).padStart(4, '0')
    const rec = { id: nid('in'), code: `INV-202606-${seq}`, status: 'Draft', payments: [], items: [], ...inv }
    setInvoices((l) => [rec, ...l]); return rec
  }
  const addPayment = (invId, pay) => setInvoices((l) => l.map((i) => {
    if (i.id !== invId) return i
    const payments = [...(i.payments || []), pay]
    const total = i.items.reduce((s, it) => s + it.qty * it.rate * (1 + it.tax / 100), 0)
    const paid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
    const status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Draft'
    return { ...i, payments, status }
  }))

  const approveStory = (id) => setGallery((l) => l.map((g) => (g.id === id ? { ...g, status: 'Published' } : g)))
  const addStory = (s) => setGallery((l) => [{ id: nid('g'), status: 'Pending', date: 'June 2026', ...s }, ...l])
  const addUser = (u) => { const rec = { id: nid('u'), status: 'Active', ...u }; setUsers((l) => [rec, ...l]); return rec }
  // Renaming a member cascades everywhere the name is referenced:
  // assignment rotations (rules + fallback) and each lead's assignee.
  const updateUser = (id, patch) => {
    const prev = users.find((u) => u.id === id)
    setUsers((l) => l.map((u) => (u.id === id ? { ...u, ...patch } : u)))
    if (prev && patch.name && patch.name !== prev.name) {
      const from = prev.name, to = patch.name
      setAssignment((a) => ({
        ...a,
        rules: a.rules.map((r) => (r.members.includes(from) ? { ...r, members: r.members.map((m) => (m === from ? to : m)) } : r)),
        fallback: { ...a.fallback, members: (a.fallback?.members || []).map((m) => (m === from ? to : m)) },
      }))
      setClients((l) => l.map((c) => (c.query?.assignee === from ? { ...c, query: { ...c.query, assignee: to } } : c)))
    }
  }
  // Deleting removes them from every assignment rotation; lead history keeps the name.
  const removeUser = (id) => {
    const u = users.find((x) => x.id === id)
    if (!u || u.designation === 'Owner') return
    setUsers((l) => l.filter((x) => x.id !== id))
    setAssignment((a) => ({
      ...a,
      rules: a.rules.map((r) => (r.members.includes(u.name) ? { ...r, members: r.members.filter((m) => m !== u.name), next: 0 } : r)),
      fallback: { ...a.fallback, members: (a.fallback?.members || []).filter((m) => m !== u.name), next: 0 },
    }))
  }
  const toggleTheme = (id, key) => setThemes((l) => l.map((t) => (t.id === id ? { ...t, [key]: !t[key] } : t)))

  const value = {
    agency, setAgency,
    destinations, addDestination, updateDestination,
    hotels, addHotel, updateHotel,
    cabs, addCab, updateCab,
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
    templates, themes, toggleTheme,
    inclusionPresets, addInclusionPreset, removeInclusionPreset, categoryGroups: seed.categoryGroups,
    vouchers, addVoucher, removeVoucher,
    landing, updateLanding,
    roles, addRole, removeRole, setRolePerm,
    assignment, updateAssignment, addAssignRule, updateAssignRule, removeAssignRule,
    dashboardSeries: seed.dashboardSeries, recentActivity: seed.recentActivity, plans: seed.plans,
    dashboardAnalytics: seed.dashboardAnalytics,
    toast, toasts,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
