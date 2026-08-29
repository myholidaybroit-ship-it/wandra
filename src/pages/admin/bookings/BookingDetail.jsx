import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { Button, Badge, Modal, Field, Input, PillSelect, DatePicker } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import FollowUpPanel from '../../../components/ui/FollowUpPanel'
import './booking.css'

const STATUSES = ['Active', 'Muted', 'Completed', 'Cancelled']
const METHODS = ['Online', 'UPI', 'Bank Transfer', 'Cash']
const N = (v) => Number(v) || 0
const today = () => new Date().toISOString().slice(0, 10)

function addDays(iso, n) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
function part(iso, opts) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return isNaN(d) ? iso : d.toLocaleDateString('en-IN', opts)
}

function countdown(bk, days) {
  if (bk.status === 'Completed') return { label: 'Trip completed', cls: 'done' }
  if (bk.status === 'Cancelled') return { label: 'Cancelled', cls: 'done' }
  if (!bk.travelDate) return { label: 'Date pending', cls: 'done' }
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(bk.travelDate + 'T00:00:00')
  const diff = Math.round((start - today) / 86400000)
  if (diff > 1) return { label: `Starts in ${diff} days`, cls: diff <= 7 ? 'soon' : '' }
  if (diff === 1) return { label: 'Starts tomorrow', cls: 'soon' }
  if (diff === 0) return { label: 'Starts today', cls: 'soon' }
  if (-diff < days) return { label: `On trip — day ${1 - diff}`, cls: 'soon' }
  return { label: 'Trip over', cls: 'done' }
}

export default function BookingDetail() {
  const { id } = useParams()
  const { bookings, packages, clients, hotels, cabs, agency, addBookingPayment, setBookingStatus, cancelBooking, setBookingSchedule, generateBookingSchedule, hasFeature, toast, canSeePricing } = useApp()
  const bk = bookings.find((b) => b.id === id)
  const [open, setOpen] = useState(false)
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [pay, setPay] = useState({ amount: '', method: 'Online', reference: '', date: today() })

  /* ---------- payment schedule ---------- */
  const [schedOpen, setSchedOpen] = useState(false)
  const [rows, setRows] = useState([])
  const openSchedule = () => {
    setRows((bk.schedule || []).map((r) => ({ ...r })))
    setSchedOpen(true)
  }
  const setRow = (i, patch) => setRows((l) => l.map((r, x) => (x === i ? { ...r, ...patch } : r)))
  const addRow = () => setRows((l) => [...l, { label: `Instalment ${l.length + 1}`, percent: '', amount: '', dueDate: bk?.travelDate || today(), status: 'Due' }])
  const rmRow = (i) => setRows((l) => l.filter((_, x) => x !== i))
  /* Typing a % fills the amount, and typing an amount fills the % — agents
     think in both, and the two must never drift apart on screen. */
  const setPercent = (i, v) => setRow(i, { percent: v, amount: Math.round(N(bk.value) * N(v) / 100) })
  const setAmount = (i, v) => setRow(i, { amount: v, percent: N(bk.value) ? Math.round((N(v) / N(bk.value)) * 1000) / 10 : 0 })
  const rowsTotal = rows.reduce((a, r) => a + N(r.amount), 0)
  const saveSchedule = async () => {
    try {
      await setBookingSchedule(bk.id, rows.filter((r) => N(r.amount) > 0 || r.label))
      toast('Payment schedule saved'); setSchedOpen(false)
    } catch (ex) { toast(ex.message || 'Could not save the schedule') }
  }
  const regenerate = async () => {
    try { await generateBookingSchedule(bk.id); toast('Default plan rebuilt — advance now, balance before departure') }
    catch (ex) { toast(ex.message || 'Could not rebuild the schedule') }
  }

  const pkg = packages.find((p) => p.id === bk?.packageId)

  const model = useMemo(() => {
    if (!bk) return null
    const sectors = (pkg?.sectors || []).filter((s) => s.destination)
    const destShort = sectors.map((s) => s.destination).join(' · ') || (pkg?.destination || '').split(' - ')[0] || 'Trip'
    const services = pkg?.builderV2?.options?.[pkg?.activeOption ?? 0]?.services || []
    const days = (pkg?.itinerary || []).map((d) => ({
      n: d.day, date: addDays(bk.travelDate, d.day - 1),
      title: d.title || `Day ${d.day}`, city: d.stops?.[0]?.destination || '',
      stay: (pkg?.hotelsAlloc || []).find((h) => h.night === d.day) || null,
      transfers: services.filter((s) => s.kind === 'transport' && (s.days || []).includes(d.day)),
      acts: services.filter((s) => s.kind === 'activity' && (s.days || []).includes(d.day)),
    }))
    return { destShort, days }
  }, [bk, pkg])

  const client = clients.find((c) => c.name === bk?.clientName || c.id === pkg?.clientId)
  const suppliers = useMemo(() => buildSupplierMessages({ bk, pkg, client, hotels, cabs, agency }), [bk, pkg, client, hotels, cabs, agency])

  if (!bk) return <div className="t-body-md">Booking not found. <Link className="c-link" to="/app/bookings">Back to Bookings</Link></div>

  const balance = Math.max(0, bk.value - bk.paid)
  const pct = Math.round((bk.paid / (bk.value || 1)) * 100)
  const cd = countdown(bk, model.days.length || pkg?.days || 0)

  const record = () => {
    if (!pay.amount) return toast('Enter an amount')
    addBookingPayment(bk.id, { ...pay, amount: Number(pay.amount) })
    toast('Payment recorded'); setOpen(false); setPay({ amount: '', method: 'Online', reference: '', date: '2026-06-26' })
  }

  return (
    <div className="bk">
      {/* ---------- Header ---------- */}
      <div className="bk-head">
        <Link to="/app/bookings" className="bk-back"><Icon name="chevron" size={14} className="bk-back-ic" /> Bookings</Link>
        <div className="bk-head-row">
          <div className="bk-head-l">
            <span className="bk-code">{bk.code}</span>
            <Badge tone={bk.status}>{bk.status}</Badge>
            <span className={`bk-countdown ${cd.cls}`}>{cd.label}</span>
          </div>
          <div className="pd-toolbar-r">
            <PillSelect value={bk.status} options={STATUSES} onChange={(v) => {
              if (v === 'Cancelled') { cancelBooking(bk.id); toast('Booking cancelled — package back to Quoted') }
              else { setBookingStatus(bk.id, v); toast(`Booking ${v}`) }
            }} />
            {canSeePricing && <>
              <Link to={`/app/invoices/new?booking=${bk.id}`}><Button variant="secondary" size="sm">Create Invoice</Button></Link>
              <Button size="sm" onClick={() => setOpen(true)}>+ Add Payment</Button>
            </>}
            <Button variant="secondary" size="sm" onClick={() => setSupplierOpen(true)}>Supplier Messages</Button>
          </div>
        </div>
        <h1 className="bk-title">{model.destShort} <span>— {client ? <Link to={`/app/clients/${client.id}`} className="c-link">{bk.clientName}</Link> : bk.clientName}</span></h1>
      </div>

      {/* ---------- Stat strip ---------- */}
      <div className="bk-strip">
        <div className="bk-stat"><div className="bk-stat-k">Travel date</div><div className="bk-stat-v">{part(bk.travelDate, { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
        <div className="bk-stat"><div className="bk-stat-k">Duration</div><div className="bk-stat-v">{pkg ? `${pkg.nights}N / ${pkg.days}D` : '—'}</div></div>
        {canSeePricing && <>
          <div className="bk-stat"><div className="bk-stat-k">Booking value</div><div className="bk-stat-v">{inr(bk.value)}</div></div>
          <div className="bk-stat"><div className="bk-stat-k">Balance due</div><div className={`bk-stat-v ${balance > 0 ? 'due' : 'ok'}`}>{inr(balance)}</div></div>
        </>}
      </div>

      <div className="bk-grid">
        {/* ---------- What still has to happen ---------- */}
        <FollowUpPanel kind="booking" id={bk.id} code={bk.code} label={bk.clientName} title="Trip checklist" />

        {/* ---------- Schedule ---------- */}
        <section className="bk-card">
          <div className="bk-card-head">
            <span className="bk-card-title">Schedule</span>
            <span className="bk-card-sub">{model.days.length} days · day-by-day plan</span>
          </div>
          {model.days.length === 0 && <div className="bk-empty">No day-wise plan on the linked package.</div>}
          <div className="bk-sched">
            {model.days.map((d) => (
              <div className="bk-day" key={d.n}>
                <div className="bk-day-tile">
                  <span className="bk-tile-dow">{part(d.date, { weekday: 'short' })}</span>
                  <span className="bk-tile-num">{part(d.date, { day: '2-digit' })}</span>
                  <span className="bk-tile-mon">{part(d.date, { month: 'short' })}</span>
                </div>
                <div className="bk-day-body">
                  <div className="bk-day-t"><span className="bk-day-tag">Day {d.n}</span>{d.title}{d.city && d.city !== d.title ? <span className="bk-day-city">{d.city}</span> : null}</div>
                  {d.transfers.map((t, i) => (
                    <div className="bk-item" key={`t${i}`}>
                      <span className="bk-item-kind">Transfer</span>
                      <span>{t.location || '—'}{t.serviceType ? ` · ${t.serviceType}` : ''}</span>
                    </div>
                  ))}
                  {d.acts.map((a, i) => (
                    <div className="bk-item" key={`a${i}`}>
                      <span className="bk-item-kind">Activity</span>
                      <span>{a.location || '—'}</span>
                    </div>
                  ))}
                  {d.stay && (
                    <div className="bk-item stay">
                      <Icon name="hotels" size={13} />
                      <span>Overnight — <strong>{d.stay.name}</strong>{d.stay.roomType ? ` · ${d.stay.roomType}` : ''}{d.stay.mealPlan ? ` · ${d.stay.mealPlan}` : ''}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Rail ---------- */}
        <aside className="bk-rail">
          {canSeePricing && (<>
          <div className="bk-card">
            <div className="bk-card-head"><span className="bk-card-title">Collection</span><span className="bk-pct">{pct}%</span></div>
            <div className="bk-money-row"><span>Booking value</span><strong>{inr(bk.value)}</strong></div>
            <div className="bk-money-row"><span>Paid</span><strong className="ok">{inr(bk.paid)}</strong></div>
            <div className="bk-money-row"><span>Balance due</span><strong className={balance > 0 ? 'due' : 'ok'}>{inr(balance)}</strong></div>
            <div className="bk-bar"><span style={{ width: `${Math.min(100, pct)}%` }} /></div>
            <Button className="w-full mt-base" onClick={() => setOpen(true)}>+ Add Payment</Button>
          </div>

          {hasFeature('bookings.payment_schedule') && (
            <div className="bk-card">
              <div className="bk-card-head">
                <span className="bk-card-title">Payment schedule</span>
                <span className="bk-card-sub">{(bk.schedule || []).length ? `${(bk.schedule || []).filter((r) => r.status === 'Paid').length}/${bk.schedule.length} settled` : 'not set'}</span>
              </div>
              {(bk.schedule || []).length === 0 && (
                <div className="bk-empty">No plan yet — split this trip into an advance and a balance so the follow-up engine can chase each due date.</div>
              )}
              {(bk.schedule || []).length > 0 && (() => {
                // at-a-glance: how many instalments are still open, and how much is left to collect
                const rows = bk.schedule || []
                const pending = rows.filter((r) => r.status !== 'Paid')
                const toCollect = pending.reduce((a, r) => a + N(r.amount), 0)
                const settled = rows.reduce((a, r) => a + (r.status === 'Paid' ? N(r.amount) : 0), 0)
                return (
                  <div className="bk-inst-sum">
                    <span><b>{pending.length}</b> instalment{pending.length === 1 ? '' : 's'} pending</span>
                    <span className="due"><b>{inr(toCollect)}</b> to collect</span>
                    <span><b>{inr(settled)}</b> settled</span>
                  </div>
                )
              })()}
              {(bk.schedule || []).map((r, i) => {
                const late = r.status !== 'Paid' && r.dueDate && r.dueDate < today()
                return (
                  <div className={`bk-inst ${r.status === 'Paid' ? 'paid' : ''} ${late ? 'late' : ''}`} key={r.id || i}>
                    <span className="bk-inst-dot" />
                    <span className="bk-inst-m">
                      <span className="bk-inst-l">{r.label || `Instalment ${i + 1}`}{N(r.percent) ? <span className="bk-inst-pct">{N(r.percent)}%</span> : null}</span>
                      <span className="bk-inst-d">{r.status === 'Paid' ? `Paid ${part(r.paidDate, { day: '2-digit', month: 'short' }) || ''}` : `Due ${part(r.dueDate, { day: '2-digit', month: 'short', year: 'numeric' })}`}{late ? ' · overdue' : ''}</span>
                    </span>
                    <span className="bk-inst-amt">{inr(r.amount)}</span>
                  </div>
                )
              })}
              <div className="row gap-xs mt-base">
                <Button size="sm" variant="secondary" className="w-full" onClick={openSchedule}>{(bk.schedule || []).length ? 'Edit plan' : 'Set up plan'}</Button>
                <Button size="sm" variant="tertiary" onClick={regenerate} title="Rebuild the default advance / balance split">Reset</Button>
              </div>
              <div className="bk-inst-note">Instalments settle automatically against the payments you record — they never claim more paid than you've collected.</div>
            </div>
          )}

          {(bk.payments || []).length > 0 && (
            <div className="bk-card">
              <div className="bk-card-head"><span className="bk-card-title">Payments</span><span className="bk-card-sub">{bk.payments.length}</span></div>
              {bk.payments.map((p, i) => (
                <div className="bk-pay" key={i}>
                  <span className="bk-pay-m">{p.method}{p.reference && <span className="bk-pay-ref">{p.reference}</span>}
                    <span className="bk-pay-date">{part(p.date, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </span>
                  <span className="bk-pay-amt">+{inr(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
          </>)}

          {pkg && (
            <div className="bk-card bk-links">
              <Link to={`/app/packages/${pkg.id}`}><Button variant="secondary" className="w-full">Open package {pkg.code}</Button></Link>
              <Button variant="secondary" className="w-full" onClick={() => setSupplierOpen(true)}>Send hotel / cab details</Button>
            </div>
          )}
        </aside>
      </div>

      {/* ---------- Add payment ---------- */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Payment"
        footer={<><Button variant="tertiary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={record}>Save Payment</Button></>}>
        <div className="col gap-base">
          <Field label="Amount (₹)"><Input type="number" min="0" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder="e.g. 10000" /></Field>
          <Field label="Method"><PillSelect value={pay.method} options={METHODS} onChange={(v) => setPay({ ...pay, method: v })} /></Field>
          <Field label="Reference No."><Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} placeholder="UTR / txn id — optional" /></Field>
          <Field label="Date"><DatePicker value={pay.date} onChange={(v) => setPay({ ...pay, date: v })} /></Field>
        </div>
      </Modal>

      {/* ---------- Payment schedule ---------- */}
      <Modal open={schedOpen} onClose={() => setSchedOpen(false)} title="Payment schedule" width={720}
        footer={<>
          <Button variant="tertiary" onClick={() => setSchedOpen(false)}>Cancel</Button>
          <Button onClick={saveSchedule}>Save plan</Button>
        </>}>
        <div className="col gap-base">
          <p className="t-body-sm c-muted">
            Split <strong>{inr(bk.value)}</strong> into the instalments this trip is actually billed in. Each due date gets its own
            follow-up, and rows settle themselves as you record payments.
          </p>
          <div className="bk-sched-head"><span>Instalment</span><span>%</span><span>Amount (₹)</span><span>Due date</span><span /></div>
          {rows.map((r, i) => (
            <div className="bk-sched-row" key={r.id || i}>
              <Input value={r.label || ''} onChange={(e) => setRow(i, { label: e.target.value })} placeholder="e.g. Advance to confirm" />
              <Input type="number" value={r.percent ?? ''} onChange={(e) => setPercent(i, e.target.value)} placeholder="30" />
              <Input type="number" value={r.amount ?? ''} onChange={(e) => setAmount(i, e.target.value)} placeholder="0" />
              <DatePicker value={r.dueDate || ''} onChange={(v) => setRow(i, { dueDate: v })} placeholder="Due" />
              <button className="ic-x" title="Remove instalment" onClick={() => rmRow(i)}><Icon name="trash" size={13} /></button>
            </div>
          ))}
          {rows.length === 0 && <div className="bk-empty">No instalments — add one, or hit Reset to rebuild the default split.</div>}
          <div className="row-between">
            <Button size="sm" variant="secondary" onClick={addRow}>+ Add instalment</Button>
            <span className={`bk-sched-total ${rowsTotal === Math.round(N(bk.value)) ? 'ok' : 'off'}`}>
              {inr(rowsTotal)} of {inr(bk.value)}
              {rowsTotal !== Math.round(N(bk.value)) && <span className="bk-sched-gap"> · {inr(Math.round(N(bk.value)) - rowsTotal)} unallocated</span>}
            </span>
          </div>
        </div>
      </Modal>

      <Modal open={supplierOpen} onClose={() => setSupplierOpen(false)} title="Hotel & Cab Supplier Messages" width={760}
        footer={<Button variant="tertiary" onClick={() => setSupplierOpen(false)}>Close</Button>}>
        <div className="bk-supplier-list">
          {suppliers.length === 0 && <div className="bk-empty">No hotel or cab suppliers found on this booking.</div>}
          {suppliers.map((s, i) => (
            <div className="bk-supplier" key={`${s.kind}-${i}`}>
              <div>
                <div className="bk-supplier-title">{s.kind} · {s.name}</div>
                <div className="bk-supplier-sub">{[s.phone, s.email].filter(Boolean).join(' · ') || 'No contact saved in master data'}</div>
              </div>
              <div className="bk-supplier-actions">
                <Button size="sm" variant="secondary" onClick={() => { navigator.clipboard?.writeText(s.message); toast('Message copied') }}>Copy</Button>
                {s.phone && <Button size="sm" variant="secondary" onClick={() => window.open(`https://wa.me/${s.phone.replace(/\D/g, '')}?text=${encodeURIComponent(s.message)}`, '_blank')}>WhatsApp</Button>}
                {s.email && <Button size="sm" onClick={() => { window.location.href = `mailto:${s.email}?subject=${encodeURIComponent(s.subject)}&body=${encodeURIComponent(s.message)}` }}>Email</Button>}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

function fmtSupplierDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  return isNaN(d) ? iso : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function buildSupplierMessages({ bk, pkg, client, hotels, cabs, agency }) {
  if (!bk || !pkg) return []
  const contactLine = [client?.phone || pkg.clientPhone, client?.email || pkg.clientEmail].filter(Boolean).join(' · ')
  const tripLine = `${pkg.destination || 'Trip'} · ${fmtSupplierDate(bk.travelDate)} to ${fmtSupplierDate(addDays(bk.travelDate, (pkg.nights || 0)))} · ${pkg.nights}N/${pkg.days}D`
  const pax = pkg.pax || {}
  const guest = `${bk.clientName}${contactLine ? ` (${contactLine})` : ''}`
  const dayPlan = (pkg.itinerary || []).map((d) => `Day ${d.day}: ${d.title || ''}${d.description ? ` - ${d.description}` : ''}`).join('\n')
  const base = [
    `Hello, this is ${agency?.name || 'Travel Team'}. Booking is confirmed.`,
    `Guest: ${guest}`,
    `Trip: ${tripLine}`,
    `Pax: ${Number(pax.adults) || 0} adults${Number(pax.children) ? `, ${pax.children} children` : ''}${Number(pax.infants) ? `, ${pax.infants} infants` : ''}`,
  ]

  const hotelRows = []
  ;(pkg.hotelsAlloc || []).forEach((h) => {
    const key = `${h.hotelId || h.name}-${h.roomType || ''}`
    const row = hotelRows.find((x) => x.key === key)
    if (row) { row.nights.push(h.night); return }
    const master = hotels.find((x) => x.id === h.hotelId) || hotels.find((x) => x.name === h.name) || {}
    hotelRows.push({ key, h, master, nights: [h.night] })
  })

  const hotelMessages = hotelRows.map(({ h, master, nights }) => {
    const checkIn = addDays(bk.travelDate, Math.min(...nights) - 1)
    const checkOut = addDays(bk.travelDate, Math.max(...nights))
    const message = [
      ...base,
      `Hotel: ${h.name}`,
      `Check-in: ${fmtSupplierDate(checkIn)}`,
      `Check-out: ${fmtSupplierDate(checkOut)}`,
      `Rooms: ${h.rooms || 1}`,
      `Room type: ${h.roomType || '—'}`,
      `Meal plan: ${h.mealPlan || '—'}`,
      '',
      'Day-wise plan:',
      dayPlan || 'Plan not added.',
      '',
      'Please confirm availability and booking acknowledgement.',
    ].join('\n')
    return { kind: 'Hotel', name: h.name || master.name || 'Hotel', phone: master.phone || '', email: master.email || '', subject: `Booking confirmation · ${bk.code} · ${bk.clientName}`, message }
  })

  const active = pkg.builderV2?.options?.[pkg.activeOption ?? 0] || {}
  const cabMessages = (active.services || []).filter((s) => s.kind === 'transport').map((s) => {
    const master = cabs.find((c) => c.id === s.cabId) || cabs.find((c) => c.name === s.cabName) || {}
    const serviceDays = (s.days || []).map((d) => `Day ${d} (${fmtSupplierDate(addDays(bk.travelDate, d - 1))})`).join(', ')
    const message = [
      ...base,
      `Vehicle: ${s.cabName || master.name || 'Cab'}`,
      `Service: ${s.location || 'Transfer'}${s.serviceType ? ` · ${s.serviceType}` : ''}`,
      `Days: ${serviceDays || 'As per plan'}`,
      s.description ? `Notes: ${s.description}` : '',
      '',
      'Day-wise plan:',
      dayPlan || 'Plan not added.',
      '',
      'Please confirm driver/vehicle details.',
    ].filter(Boolean).join('\n')
    return { kind: 'Cab', name: s.cabName || master.name || s.location || 'Cab', phone: master.contact || '', email: '', subject: `Cab confirmation · ${bk.code} · ${bk.clientName}`, message }
  })

  return [...hotelMessages, ...cabMessages]
}
