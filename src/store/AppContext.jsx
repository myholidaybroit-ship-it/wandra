import { createContext, useContext, useState, useCallback } from 'react'
import * as seed from '../data/mockData'

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

let idc = 1000
const nid = (p) => `${p}${++idc}`

// ---- Pricing engine (mirrors the demo's auto-calc) ----
export function computePricing(pkg) {
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

export function AppProvider({ children }) {
  const [agency, setAgency] = useState(seed.agency)
  const [destinations, setDestinations] = useState(seed.destinations)
  const [hotels, setHotels] = useState(seed.hotels)
  const [cabs, setCabs] = useState(seed.cabs)
  const [clients, setClients] = useState(seed.clients)
  const [packages, setPackages] = useState(seed.packages)
  const [bookings, setBookings] = useState(seed.bookings)
  const [invoices, setInvoices] = useState(seed.invoices)
  const [quotations, setQuotations] = useState(seed.quotations)
  const [gallery, setGallery] = useState(seed.galleryStories)
  const [users, setUsers] = useState(seed.users)
  const [templates] = useState(seed.itineraryTemplates)
  const [themes, setThemes] = useState(seed.previewThemes)
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg) => {
    const id = nid('t')
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600)
  }, [])

  // ---- generic add/update/remove factories ----
  const addClient = (c) => { const code = `CLI-202602-${String(clients.length + 1).padStart(3, '0')}`; const rec = { id: nid('cl'), code, status: 'Active', leadTemp: 'Warm', createdAt: '2026-06-26', ...c }; setClients((l) => [rec, ...l]); return rec }
  const addDestination = (d) => setDestinations((l) => [{ id: nid('d'), ...d }, ...l])
  const addHotel = (h) => setHotels((l) => [{ id: nid('h'), ...h }, ...l])
  const addCab = (c) => setCabs((l) => [{ id: nid('c'), status: 'Active', ...c }, ...l])
  const updateClient = (id, patch) => setClients((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const updateDestination = (id, patch) => setDestinations((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const updateHotel = (id, patch) => setHotels((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const updateCab = (id, patch) => setCabs((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const addPackage = (p) => {
    const seq = String(packages.length + 4).padStart(4, '0')
    const rec = { id: nid('pk'), code: `PKG-202606-${seq}`, createdAt: '2026-06-26', createdBy: agency.name, paid: 0, status: p.status || 'Draft', ...p }
    setPackages((l) => [rec, ...l])
    // auto-create a quotation entry
    const pr = computePricing(rec)
    setQuotations((q) => [{ id: nid('q'), packageId: rec.id, packageCode: rec.code, client: rec.clientName, travelDate: rec.startDate, phone: '', email: '', status: rec.status === 'Confirmed' ? 'Confirmed' : 'Sent', amount: pr.grandTotal }, ...q])
    return rec
  }
  const updatePackage = (id, patch) => setPackages((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const addPackageLog = (id, text) => setPackages((l) => l.map((p) => (p.id === id ? { ...p, logs: [{ id: nid('lg'), text, at: '2026-06-26' }, ...(p.logs || [])] } : p)))
  const setPackageStatus = (id, status) => { updatePackage(id, { status }); addPackageLog(id, `Status changed to ${status}`); setQuotations((q) => q.map((x) => (x.packageId === id ? { ...x, status: status === 'Confirmed' ? 'Confirmed' : status === 'Cancelled' ? 'Cancelled' : 'Sent' } : x))) }

  const createBookingFromPackage = (pkg) => {
    const existing = bookings.find((b) => b.packageId === pkg.id)
    if (existing) return existing
    const pr = computePricing(pkg)
    const seq = String(bookings.length + 3).padStart(4, '0')
    const rec = { id: nid('bk'), code: `BKG-202606-${seq}`, packageId: pkg.id, clientName: pkg.clientName, travelDate: pkg.startDate, status: 'Active', value: pr.grandTotal, paid: pkg.paid || 0, payments: [] }
    setBookings((l) => [rec, ...l])
    setPackageStatus(pkg.id, 'Confirmed')
    addPackageLog(pkg.id, `Booking ${rec.code} created`)
    return rec
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
  const addUser = (u) => setUsers((l) => [{ id: nid('u'), status: 'Active', ...u }, ...l])
  const toggleTheme = (id, key) => setThemes((l) => l.map((t) => (t.id === id ? { ...t, [key]: !t[key] } : t)))

  const value = {
    agency, setAgency,
    destinations, addDestination, updateDestination,
    hotels, addHotel, updateHotel,
    cabs, addCab, updateCab,
    clients, addClient, updateClient,
    packages, addPackage, updatePackage, setPackageStatus, addPackageLog,
    bookings, createBookingFromPackage, addBookingPayment, setBookingStatus,
    invoices, addInvoice, addPayment,
    quotations, setQuotationStatus,
    gallery, approveStory, addStory,
    users, addUser,
    templates, themes, toggleTheme,
    inclusionPresets: seed.inclusionPresets, categoryGroups: seed.categoryGroups,
    dashboardSeries: seed.dashboardSeries, recentActivity: seed.recentActivity, plans: seed.plans,
    toast, toasts,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
