import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button, Field, Input, DatePicker } from './UI'
import { Icon } from './icons'
import { useApp, inr } from '../../store/AppContext'
import './season-rates.css'

/* ============================================================
   Season-wise rate rows — shared by hotels, activities and transport.

   Each row is a date window with its own prices. Anything left blank
   falls back to the master's default price, so a season can override
   just one number (e.g. only the room rate goes up in December).
   ============================================================ */

const N = (v) => Number(v) || 0
const today = () => new Date().toISOString().slice(0, 10)
const addMonths = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setMonth(d.getMonth() + n)
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const fmt = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

let rowSeq = 0
const rowId = () => `sr${Date.now()}${++rowSeq}`

/** Rows that overlap each other — flagged so nobody ships an ambiguous season. */
function overlaps(rows) {
  const bad = new Set()
  const val = (r) => ({ from: r.from || '0000-01-01', to: r.to || '9999-12-31' })
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = val(rows[i]), b = val(rows[j])
      if (a.from <= b.to && b.from <= a.to) { bad.add(i); bad.add(j) }
    }
  }
  return bad
}

/**
 * props:
 *   value     the rows array
 *   onChange  (rows) => void
 *   fields    [{ key, label, hint }] — the price columns for this master
 *   base      the master's own flat prices, shown as the fallback placeholder
 */
export default function SeasonRates({ value = [], onChange, fields, base = {}, hint }) {
  const { hasFeature } = useApp()
  const rows = value || []
  const clashes = useMemo(() => overlaps(rows), [rows])

  /* Date-range pricing is a Pro capability. Rows already saved keep working —
     the resolver honours them server-side either way — they just can't be
     edited here until the plan covers it. */
  if (!hasFeature('master.seasonal_rates')) {
    return (
      <div className="sr sr-locked">
        <div className="sr-title">Season-wise rates</div>
        <div className="sr-sub">
          Charge one rate for Aug–Nov and another for Dec–Jan, with the quote picking the season that covers the travel date.
          {rows.length > 0 && <> This record already has <strong>{rows.length} season{rows.length > 1 ? 's' : ''}</strong> saved, and quotes still price off them.</>}
        </div>
        <Link to="/app/upgrade" className="sr-upgrade">Available on Pro →</Link>
      </div>
    )
  }

  const set = (i, patch) => onChange(rows.map((r, x) => (x === i ? { ...r, ...patch } : r)))
  const add = () => {
    const last = rows[rows.length - 1]
    const from = last?.to ? addMonths(last.to, 0) : today()
    onChange([...rows, { id: rowId(), label: '', from, to: addMonths(from, 3), ...Object.fromEntries(fields.map((f) => [f.key, ''])) }])
  }
  const rm = (i) => onChange(rows.filter((_, x) => x !== i))
  const dup = (i) => onChange([...rows.slice(0, i + 1), { ...rows[i], id: rowId(), label: `${rows[i].label || 'Season'} (copy)` }, ...rows.slice(i + 1)])

  return (
    <div className="sr">
      <div className="sr-head">
        <div>
          <div className="sr-title">Season-wise rates</div>
          <div className="sr-sub">
            {hint || 'Different prices for different travel dates — e.g. Aug–Nov at one rate, Dec–Jan at another. The quote picks the row that covers the trip’s start date.'}
          </div>
        </div>
        <Button size="sm" variant="secondary" onClick={add}><Icon name="plus" size={14} /> Add season</Button>
      </div>

      {rows.length === 0 && (
        <div className="sr-empty">
          No seasons yet — the default prices above apply all year round.
        </div>
      )}

      {rows.map((r, i) => (
        <div className={`sr-row ${clashes.has(i) ? 'clash' : ''}`} key={r.id || i}>
          <div className="sr-row-top">
            <span className="sr-seq">{i + 1}</span>
            <Field label="Season name">
              <Input value={r.label || ''} onChange={(e) => set(i, { label: e.target.value })} placeholder="e.g. Peak — Christmas & New Year" />
            </Field>
            <Field label="From">
              <DatePicker value={r.from || ''} onChange={(v) => set(i, { from: v })} placeholder="Start" />
            </Field>
            <Field label="To">
              <DatePicker value={r.to || ''} onChange={(v) => set(i, { to: v })} placeholder="End" />
            </Field>
            <div className="sr-row-acts">
              <button className="sr-act" onClick={() => dup(i)} title="Duplicate season"><Icon name="copy" size={14} /></button>
              <button className="sr-act danger" onClick={() => rm(i)} title="Remove season"><Icon name="trash" size={14} /></button>
            </div>
          </div>

          <div className="sr-prices">
            {fields.map((f) => (
              <Field key={f.key} label={f.label} hint={N(base[f.key]) ? `default ${inr(base[f.key])}` : f.hint}>
                <Input type="number" value={r[f.key] ?? ''} onChange={(e) => set(i, { [f.key]: e.target.value })}
                  placeholder={N(base[f.key]) ? String(base[f.key]) : '0'} />
              </Field>
            ))}
          </div>

          <div className="sr-foot">
            <span>{fmt(r.from)} → {fmt(r.to)}</span>
            {clashes.has(i) && <span className="sr-warn">Overlaps another season — the narrower window wins</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Strip empty rows and coerce the price fields before saving a master. */
export function cleanSeasonRates(rows, fields) {
  return (rows || [])
    .filter((r) => r.from || r.to)
    .map((r) => ({
      label: r.label || '',
      from: r.from || '',
      to: r.to || '',
      ...Object.fromEntries(fields.map((f) => [f.key, String(r[f.key] ?? '').trim() === '' ? null : N(r[f.key])])),
    }))
}

export const HOTEL_SEASON_FIELDS = [
  { key: 'buyingPrice', label: 'Room / night (₹)' },
  { key: 'extraBedAdult', label: 'AWEB (₹)', hint: 'adult extra bed' },
  { key: 'extraBedChild', label: 'CWEB (₹)', hint: 'child extra bed' },
  { key: 'childNoBed', label: 'CNB (₹)', hint: 'child no bed' },
  { key: 'infantCharge', label: 'Infant (₹)', hint: 'usually 0 — infants stay free' },
]
export const ACTIVITY_SEASON_FIELDS = [
  { key: 'cost', label: 'Adult cost (₹)' },
  { key: 'sell', label: 'Adult selling (₹)' },
  { key: 'costChild', label: 'Child cost (₹)' },
  { key: 'sellChild', label: 'Child selling (₹)' },
]
export const SERVICE_SEASON_FIELDS = [
  { key: 'cost', label: 'Cost (₹)' },
  { key: 'sell', label: 'Selling (₹)' },
]
