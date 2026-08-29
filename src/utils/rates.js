/* ============================================================
   Season-wise (date-range) rates — CRM side.

   Mirrors wandra-backend/src/utils/seasonRates.js exactly. Every priced
   master (hotel, activity/sightseeing, transport route) keeps its flat
   "default" prices plus a list of season rows:

     { label, from, to, …prices }

   The row whose window covers the travel date wins; the narrowest match
   wins when several overlap, so a short festive block always beats the
   broad season it sits inside. Nothing matching (or no date yet) falls
   back to the master's own flat fields.
   ============================================================ */

const ymd = (v) => (typeof v === 'string' ? v.slice(0, 10) : '')

export function seasonCovers(row, date) {
  const d = ymd(date)
  if (!d || !row) return false
  const from = ymd(row.from), to = ymd(row.to)
  if (from && d < from) return false
  if (to && d > to) return false
  return !!(from || to)
}

export function seasonFor(rates, date) {
  const list = (rates || []).filter((r) => seasonCovers(r, date))
  if (!list.length) return null
  const span = (r) => {
    const from = ymd(r.from), to = ymd(r.to)
    if (!from || !to) return Number.MAX_SAFE_INTEGER
    return (new Date(to) - new Date(from)) || 0
  }
  return list.slice().sort((a, b) => span(a) - span(b))[0]
}

/** Merge a master's flat prices with the season row that applies on `date`. */
export function resolveRates(master, date, fields) {
  const out = {}
  const row = seasonFor(master?.rates, date)
  for (const f of fields) {
    const sv = row ? row[f] : null
    out[f] = sv === null || sv === undefined || sv === '' ? (Number(master?.[f]) || 0) : Number(sv) || 0
  }
  out.season = row || null
  out.seasonLabel = row ? (row.label || `${ymd(row.from)} → ${ymd(row.to)}`) : ''
  return out
}

export const HOTEL_RATE_FIELDS = ['buyingPrice', 'extraBedAdult', 'extraBedChild', 'childNoBed']
export const ACTIVITY_RATE_FIELDS = ['cost', 'sell', 'costChild', 'sellChild']
export const SERVICE_RATE_FIELDS = ['cost', 'sell']

export const hotelRates = (hotel, date) => resolveRates(hotel, date, HOTEL_RATE_FIELDS)
export const activityRates = (activity, date) => resolveRates(activity, date, ACTIVITY_RATE_FIELDS)
export const serviceRates = (service, date) => resolveRates(service, date, SERVICE_RATE_FIELDS)

/** A one-line "why this price" note for the builder — '' when nothing applied. */
export const seasonNote = (resolved) => (resolved?.seasonLabel ? `Season: ${resolved.seasonLabel}` : '')

/* ---------- duration ---------- */
/** Duration in HOURS from either the new field or a legacy minutes value. */
export const hoursOf = (m) => {
  const h = Number(m?.durationHours)
  if (h > 0) return h
  const mins = Number(m?.durationMins)
  return mins > 0 ? Math.round((mins / 60) * 100) / 100 : 0
}
/** '2 hrs' / '45 mins' / '1 hr 30 mins' — never a bare decimal. */
export const fmtHours = (h) => {
  const v = Number(h) || 0
  if (!v) return ''
  const whole = Math.floor(v)
  const mins = Math.round((v - whole) * 60)
  if (!whole) return `${mins} mins`
  return `${whole} hr${whole === 1 ? '' : 's'}${mins ? ` ${mins} mins` : ''}`
}
