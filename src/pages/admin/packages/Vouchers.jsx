import { useState } from 'react'
import { VoucherCard } from '../../../components/ui/VoucherCard'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Button, Modal, Field, Input, PillSelect, DatePicker, Textarea } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './vouchers.css'

const TYPES = ['Hotel', 'Transport', 'Activity']

function addDays(iso, n) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n)
  // format in LOCAL time — toISOString() shifts to UTC and lands a day early for IST
  const p = (x) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
const fmtD = (iso) => (iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '')

export default function Vouchers() {
  const { id } = useParams()
  const { packages, clients, hotels, cabs, vouchers, addVoucher, removeVoucher, toast, agency } = useApp()
  const pkg = packages.find((p) => p.id === id)
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(null)
  if (!pkg) return <div>Not found. <Link className="c-link" to="/app/packages">Back</Link></div>

  const pkgVouchers = vouchers.filter((v) => v.packageId === pkg.id)

  /* ---------- generate ONE unified Travel Pass from the package ----------
     Every hotel stay, transfer and activity becomes a section of a single
     pass — the traveller carries one document for the whole trip. */
  const generate = async () => {
    const sections = []
    // group consecutive hotel nights into stays
    const stays = []
    ;(pkg.hotelsAlloc || []).forEach((h) => {
      const last = stays[stays.length - 1]
      if (last && last.name === h.name && last.room === h.roomType) { last.nights++; last.out = addDays(pkg.startDate, h.night) }
      else stays.push({ name: h.name, room: h.roomType, meal: h.mealPlan || '', nights: 1, in: addDays(pkg.startDate, h.night - 1), out: addDays(pkg.startDate, h.night) })
    })
    stays.forEach((s) => {
      sections.push({
        tag: 'Hotel', title: s.name,
        fields: [
          { k: 'Room', v: s.room }, { k: 'Meal plan', v: s.meal },
          { k: 'Check-in', v: fmtD(s.in) }, { k: 'Check-out', v: fmtD(s.out) }, { k: 'Nights', v: String(s.nights) },
        ].filter((x) => x.v),
      })
    })
    ;(pkg.cabs || []).forEach((c) => {
      sections.push({
        tag: 'Transport', title: c.name || 'Transfer',
        fields: [
          { k: 'Vehicle', v: c.type || '—' }, { k: 'Service', v: c.serviceType || 'Private Transfer' },
          { k: 'Date', v: c.days?.length ? fmtD(addDays(pkg.startDate, c.days[0] - 1)) : fmtD(pkg.startDate) },
          { k: 'Driver', v: 'Local Vendor' },
        ].filter((x) => x.v),
      })
    })
    if (!sections.length) return toast('Add hotels or transport to the package first')

    const existing = pkgVouchers.find((v) => v.type === 'Pass')
    if (existing) await removeVoucher(existing.id)
    await addVoucher({
      type: 'Pass', clientId: pkg.clientId || '', clientName: pkg.clientName, packageId: pkg.id,
      title: `${pkg.destination || pkg.route || pkg.code} — Travel Pass`,
      fields: [
        { k: 'Trip', v: pkg.code },
        { k: 'Start', v: fmtD(pkg.startDate) },
        { k: 'Duration', v: pkg.days ? `${pkg.days}D / ${pkg.nights ?? Math.max(0, pkg.days - 1)}N` : '' },
      ].filter((x) => x.v),
      sections,
      notes: '',
    })
    toast(existing ? 'Travel Pass refreshed with the latest package details' : 'Travel Pass generated — one pass for the whole trip')
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
      <PageHeader title="Travel Pass" subtitle={`One unified pass for ${pkg.code} — hotels, transport & activities in a single document.`}
        actions={<>
          <Link to={`/app/packages/${id}`}><Button variant="secondary">← Back to Package</Button></Link>
          <Button onClick={generate}><Icon name="refresh" size={14} /> {pkgVouchers.some((v) => v.type === 'Pass') ? 'Refresh Travel Pass' : 'Generate Travel Pass'}</Button>
          <Button variant="secondary" onClick={openCreate}>+ Single voucher</Button>
        </>} />

      {pkgVouchers.length === 0 && (
        <div className="v-empty">
          <span className="v-empty-ic"><Icon name="file" size={20} /></span>
          <div className="v-empty-t">No travel pass yet</div>
          <p>Generate one unified pass for the whole trip — every hotel stay, transfer and activity on a single document the traveller can carry.</p>
          <div className="row gap-sm center mt-md">
            <Button onClick={generate}>Generate Travel Pass</Button>
            <Button variant="tertiary" onClick={openCreate}>+ Single voucher</Button>
          </div>
        </div>
      )}

      <div className="voucher-grid">
        {pkgVouchers.map((v) => (
          <VoucherCard key={v.id} voucher={v} agency={agency} actions={<>
            <Link to={`/voucher/${v.id}`} target="_blank" className="vcard-act" title="Preview"><Icon name="upload" size={13} className="vcard-open-ic" /></Link>
            <button className="vcard-act" title="Download PDF" onClick={() => window.open(`/voucher/${v.id}?download=1`, '_blank')}><Icon name="file" size={13} /></button>
            <button className="vcard-act danger" title="Remove" onClick={() => { removeVoucher(v.id); toast('Voucher removed') }}><Icon name="trash" size={13} /></button>
          </>} />
        ))}
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
