/* Shared shaping helpers for the follow-up queue — used by the Follow-ups page,
   the per-record panel, the topbar bell and the dashboard card. */

export const TASK_TYPES = [
  { key: 'call', label: 'Call', icon: 'clients' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'help' },
  { key: 'email', label: 'Email', icon: 'file' },
  { key: 'meeting', label: 'Meeting', icon: 'calendar' },
  { key: 'payment', label: 'Payment', icon: 'billing' },
  { key: 'document', label: 'Documents', icon: 'upload' },
  { key: 'ops', label: 'Operations', icon: 'layers' },
  { key: 'review', label: 'Testimonial', icon: 'star' },
  { key: 'other', label: 'Other', icon: 'check' },
]
export const TYPE_META = Object.fromEntries(TASK_TYPES.map((t) => [t.key, t]))

export const PRIORITIES = [
  { key: 'high', label: 'High', tone: 'error' },
  { key: 'normal', label: 'Normal', tone: 'neutral' },
  { key: 'low', label: 'Low', tone: 'neutral' },
]

export const LINK_KINDS = {
  client: { label: 'Lead', icon: 'clients', to: (id) => `/app/clients/${id}` },
  package: { label: 'Quote', icon: 'packages', to: (id) => `/app/packages/${id}` },
  booking: { label: 'Booking', icon: 'bookings', to: (id) => `/app/bookings/${id}` },
  invoice: { label: 'Invoice', icon: 'invoices', to: (id) => `/app/invoices/${id}` },
  quotation: { label: 'Quotation', icon: 'quotations', to: () => '/app/quotations' },
}

const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

/** overdue | today | tomorrow | week | later — computed client-side so a stale
 *  list still buckets correctly as the day rolls over. */
export function bucketOf(task, now = new Date()) {
  if (task.status === 'done') return 'done'
  if (task.status === 'cancelled') return 'cancelled'
  const due = new Date(task.dueAt)
  if (due <= now) return 'overdue'
  const today = startOfDay(now)
  const days = Math.round((startOfDay(due) - today) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days <= 7) return 'week'
  return 'later'
}

export const BUCKETS = [
  { key: 'overdue', label: 'Overdue', tone: 'error' },
  { key: 'today', label: 'Today', tone: 'warning' },
  { key: 'tomorrow', label: 'Tomorrow', tone: 'neutral' },
  { key: 'week', label: 'This week', tone: 'neutral' },
  { key: 'later', label: 'Later', tone: 'neutral' },
]

/** "2 days overdue" / "in 3 hours" / "Tomorrow, 10:00" */
export function dueLabel(task, now = new Date()) {
  const due = new Date(task.dueAt)
  const ms = due - now
  const abs = Math.abs(ms)
  const mins = Math.round(abs / 60000)
  const hours = Math.round(abs / 3600000)
  const days = Math.round(abs / 86400000)
  const time = due.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  if (ms < 0) {
    if (mins < 60) return `${mins} min overdue`
    if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} overdue`
    return `${days} day${days === 1 ? '' : 's'} overdue`
  }
  if (hours < 12) return mins < 60 ? `in ${mins} min` : `in ${hours} hr${hours === 1 ? '' : 's'}`
  const b = bucketOf(task, now)
  if (b === 'today') return `Today, ${time}`
  if (b === 'tomorrow') return `Tomorrow, ${time}`
  return due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + `, ${time}`
}

/** A datetime-local input value from a Date/ISO string. */
export function toLocalInput(value) {
  const d = value ? new Date(value) : new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Today at a given hour, as a datetime-local value — the quick-pick presets. */
export function presetDue(kind) {
  const d = new Date()
  if (kind === 'today') d.setHours(Math.max(d.getHours() + 1, 17), 0, 0, 0)
  if (kind === 'tomorrow') { d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0) }
  if (kind === '3d') { d.setDate(d.getDate() + 3); d.setHours(10, 0, 0, 0) }
  if (kind === 'week') { d.setDate(d.getDate() + 7); d.setHours(10, 0, 0, 0) }
  return toLocalInput(d)
}

/** Sort: overdue first, then soonest due, high priority breaking ties. */
export function sortQueue(list) {
  const rank = { high: 0, normal: 1, low: 2 }
  return [...list].sort((a, b) => {
    const d = new Date(a.dueAt) - new Date(b.dueAt)
    if (d !== 0) return d
    return (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1)
  })
}
