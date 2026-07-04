import { useState } from 'react'
import { AgencyLogo } from '../../../components/ui/AgencyBrand'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Button, Modal, Field, Input, PillSelect, DatePicker, Textarea } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './vouchers.css'

const TYPES = ['Hotel', 'Transport', 'Activity']
const TYPE_META = {
  Hotel: { tag: 'HOTEL', pass: 'HOTEL PASS', cls: 'v-tag-hotel' },
  Transport: { tag: 'TRANSPORT', pass: 'CAB PASS', cls: 'v-tag-transport' },
  Activity: { tag: 'ACTIVITY', pass: 'ENTRY PASS', cls: 'v-tag-activity' },
}

function addDays(iso, n) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}
const fmtD = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '')

export default function Vouchers() {
  const { id } = useParams()
  const { packages, clients, hotels, cabs, vouchers, addVoucher, removeVoucher, toast } = useApp()
  const pkg = packages.find((p) => p.id === id)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(null)
  if (!pkg) return <div>Not found. <Link className="c-link" to="/app/packages">Back</Link></div>

  const pkgVouchers = vouchers.filter((v) => v.packageId === pkg.id)

  /* ---------- generate records from the package ---------- */
  const generate = () => {
    const existingTitles = new Set(pkgVouchers.map((v) => `${v.type}:${v.title}`))
    let made = 0
    // group consecutive hotel nights into stays
    const stays = []
    ;(pkg.hotelsAlloc || []).forEach((h) => {
      const last = stays[stays.length - 1]
      if (last && last.name === h.name && last.room === h.roomType) { last.nights++; last.out = addDays(pkg.startDate, h.night) }
      else stays.push({ name: h.name, room: h.roomType, meal: h.mealPlan || '', nights: 1, in: addDays(pkg.startDate, h.night - 1), out: addDays(pkg.startDate, h.night) })
    })
    stays.forEach((s) => {
      if (existingTitles.has(`Hotel:${s.name}`)) return
      addVoucher({
        type: 'Hotel', clientId: pkg.clientId || '', clientName: pkg.clientName, packageId: pkg.id, title: s.name,
        fields: [
          { k: 'Room', v: s.room }, { k: 'Meal plan', v: s.meal },
          { k: 'Check-in', v: fmtD(s.in) }, { k: 'Check-out', v: fmtD(s.out) }, { k: 'Nights', v: String(s.nights) },
        ],
        notes: '',
      }); made++
    })
    ;(pkg.cabs || []).forEach((c) => {
      const title = c.name || 'Transfer'
      if (existingTitles.has(`Transport:${title}`)) return
      addVoucher({
        type: 'Transport', clientId: pkg.clientId || '', clientName: pkg.clientName, packageId: pkg.id, title,
        fields: [
          { k: 'Vehicle', v: c.type || '—' }, { k: 'Service', v: c.serviceType || 'Private Transfer' },
          { k: 'Date', v: c.days?.length ? fmtD(addDays(pkg.startDate, c.days[0] - 1)) : fmtD(pkg.startDate) },
          { k: 'Driver', v: 'Local Vendor' },
        ],
        notes: '',
      }); made++
    })
    toast(made ? `${made} voucher${made > 1 ? 's' : ''} generated` : 'Everything already generated')
  }

  /* ---------- create modal ---------- */
  const blank = (type = 'Hotel') => ({
    type, clientName: pkg.clientName, title: '',
    hotel: '', room: '', checkIn: pkg.startDate || '', nights: '1',
    from: '', to: '', vehicle: '', date: pkg.startDate || '', driver: '',
    activity: '', time: '', notes: '',
  })
  const openCreate = () => { setF(blank()); setOpen(true) }
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))

  const save = () => {
    const client = clients.find((c) => c.name === f.clientName)
    let title = '', fields = []
    if (f.type === 'Hotel') {
      title = f.hotel || f.title
      fields = [{ k: 'Room', v: f.room }, { k: 'Check-in', v: fmtD(f.checkIn) }, { k: 'Nights', v: f.nights }]
    } else if (f.type === 'Transport') {
      title = [f.from, f.to].filter(Boolean).join(' → ') || f.title || 'Transfer'
      fields = [{ k: 'Vehicle', v: f.vehicle }, { k: 'Date', v: fmtD(f.date) }, { k: 'Driver', v: f.driver }]
    } else {
      title = f.activity || f.title
      fields = [{ k: 'Date', v: fmtD(f.date) }, { k: 'Time', v: f.time }]
    }
    if (!title.trim()) return toast(f.type === 'Hotel' ? 'Pick a hotel' : f.type === 'Activity' ? 'Enter the activity' : 'Enter the route')
    addVoucher({ type: f.type, clientId: client?.id || '', clientName: f.clientName, packageId: pkg.id, title, fields: fields.filter((x) => x.v), notes: f.notes })
    toast('Voucher created')
    setOpen(false)
  }

  return (
    <div>
      <PageHeader title="Vouchers" subtitle={`Hotel, transport & activity passes for ${pkg.code}`}
        actions={<>
          <Link to={`/app/packages/${id}`}><Button variant="secondary">← Back to Package</Button></Link>
          <Button variant="secondary" onClick={generate}><Icon name="refresh" size={14} /> Generate from package</Button>
          <Button onClick={openCreate}>+ Create Voucher</Button>
        </>} />

      {pkgVouchers.length === 0 && (
        <div className="v-empty">
          <span className="v-empty-ic"><Icon name="file" size={20} /></span>
          <div className="v-empty-t">No vouchers yet</div>
          <p>Generate them from the package in one click, or create one manually and assign it to any client.</p>
          <div className="row gap-sm center mt-md">
            <Button onClick={generate}>Generate from package</Button>
            <Button variant="tertiary" onClick={openCreate}>+ Create Voucher</Button>
          </div>
        </div>
      )}

      <div className="voucher-grid">
        {pkgVouchers.map((v) => {
          const meta = TYPE_META[v.type] || TYPE_META.Hotel
          return (
            <div className="voucher" key={v.id}>
              <div className="v-left">
                <div className="row-between">
                  <span className="v-brand">Wandra Travels</span>
                  <span className={`v-tag ${meta.cls}`}>{meta.tag}</span>
                </div>
                <div className="v-hotel-name">{v.title}</div>
                <div className="v-meta">
                  <div><span className="v-k">GUEST</span><span className="v-v">{v.clientName || '—'}</span></div>
                  {(v.fields || []).slice(0, 3).map((x, i) => (
                    <div key={i}><span className="v-k">{x.k.toUpperCase()}</span><span className="v-v">{x.v}</span></div>
                  ))}
                </div>
              </div>
              <div className="v-right">
                <div className="v-pass">{meta.pass}</div>
                <div className="v-logo"><AgencyLogo /></div>
                <span className="v-code">{v.code}</span>
                <div className="v-acts">
                  <Link to={`/voucher/${v.id}`} target="_blank" className="v-act" title="Preview"><Icon name="upload" size={13} className="v-open-ic" /></Link>
                  <button className="v-act" title="Download PDF" onClick={() => window.open(`/voucher/${v.id}?download=1`, '_blank')}><Icon name="file" size={13} /></button>
                  <button className="v-act danger" title="Remove" onClick={() => { removeVoucher(v.id); toast('Voucher removed') }}><Icon name="trash" size={13} /></button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ---------- Create voucher ---------- */}
      <Modal open={open} onClose={() => setOpen(false)} title="Create Voucher" width={560}
        footer={<><Button variant="tertiary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save}>Create Voucher</Button></>}>
        {f && (
          <div className="col gap-base">
            <div className="v-form-grid">
              <Field label="Type"><PillSelect value={f.type} options={TYPES} onChange={(v) => setF((p) => ({ ...p, type: v }))} /></Field>
              <Field label="Assign to client"><PillSelect value={f.clientName} options={clients.map((c) => c.name)} onChange={set('clientName')} /></Field>
            </div>

            {f.type === 'Hotel' && <>
              <Field label="Hotel"><PillSelect value={f.hotel || 'Select hotel'} options={['Select hotel', ...hotels.map((h) => h.name)]} onChange={(v) => set('hotel')(v === 'Select hotel' ? '' : v)} /></Field>
              <div className="v-form-grid three">
                <Field label="Room type"><Input value={f.room} onChange={(e) => set('room')(e.target.value)} placeholder="Deluxe" /></Field>
                <Field label="Check-in"><DatePicker value={f.checkIn} onChange={set('checkIn')} /></Field>
                <Field label="Nights"><Input type="number" min="1" value={f.nights} onChange={(e) => set('nights')(e.target.value)} /></Field>
              </div>
            </>}

            {f.type === 'Transport' && <>
              <div className="v-form-grid">
                <Field label="From"><Input value={f.from} onChange={(e) => set('from')(e.target.value)} placeholder="Airport" /></Field>
                <Field label="To"><Input value={f.to} onChange={(e) => set('to')(e.target.value)} placeholder="Hotel" /></Field>
              </div>
              <div className="v-form-grid three">
                <Field label="Vehicle"><PillSelect value={f.vehicle || 'Select'} options={['Select', ...cabs.map((c) => c.name)]} onChange={(v) => set('vehicle')(v === 'Select' ? '' : v)} /></Field>
                <Field label="Date"><DatePicker value={f.date} onChange={set('date')} /></Field>
                <Field label="Driver"><Input value={f.driver} onChange={(e) => set('driver')(e.target.value)} placeholder="Local Vendor" /></Field>
              </div>
            </>}

            {f.type === 'Activity' && <>
              <Field label="Activity / ticket"><Input value={f.activity} onChange={(e) => set('activity')(e.target.value)} placeholder="e.g. Gulmarg Gondola — Phase 1 & 2" /></Field>
              <div className="v-form-grid">
                <Field label="Date"><DatePicker value={f.date} onChange={set('date')} /></Field>
                <Field label="Time"><Input value={f.time} onChange={(e) => set('time')(e.target.value)} placeholder="10:00" /></Field>
              </div>
            </>}

            <Field label="Notes" hint="Printed on the voucher — optional"><Textarea rows={2} value={f.notes} onChange={(e) => set('notes')(e.target.value)} placeholder="Meeting point, timings, contact person…" /></Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
