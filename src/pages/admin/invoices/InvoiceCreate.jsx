import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, Field, Input, PillSelect, DatePicker } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './invoice.css'

const TYPES = ['Booking', 'Package', 'Service']
const blankItem = () => ({ description: '', qty: 1, rate: '', tax: 0 })

export default function InvoiceCreate() {
  const { clients, packages, bookings, agency, addInvoice, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ clientId: '', type: 'Booking', bookingId: '', packageId: '', issueDate: '2026-06-26', dueDate: '', gst: false })
  const [items, setItems] = useState([blankItem()])
  const setItem = (i, k, v) => setItems(items.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)))
  const addItem = () => setItems([...items, blankItem()])
  const rmItem = (i) => setItems(items.length > 1 ? items.filter((_, idx) => idx !== i) : [blankItem()])

  const client = clients.find((c) => c.id === f.clientId)
  // once a client is picked, only their packages & bookings are offered
  const pkgOptions = f.clientId ? packages.filter((p) => p.clientId === f.clientId || p.clientName === client?.name) : packages
  const bkOptions = f.clientId ? bookings.filter((b) => b.clientName === client?.name) : bookings
  const pkgLabel = (id) => { const p = packages.find((x) => x.id === id); return p ? `${p.code} · ${(p.destination || '').split(' - ')[0]}` : 'None' }
  const bkLabel = (id) => { const b = bookings.find((x) => x.id === id); return b ? `${b.code} · ${b.clientName}` : 'None' }

  /* picking a package explodes it into line items */
  const loadFromPackage = (pid) => {
    const p = packages.find((x) => x.id === pid)
    if (!p) { setF((s) => ({ ...s, packageId: '' })); return }
    setF((s) => ({ ...s, packageId: pid, clientId: p.clientId || s.clientId }))
    setItems([
      { description: `Package Cost — ${p.clientName}`, qty: 1, rate: Number(p.pricing?.packageCost) || 0, tax: 0 },
      { description: 'Hotel & Accommodation Charges', qty: 1, rate: p.hotelsAlloc?.reduce((s, h) => s + Number(h.price || 0), 0) || 0, tax: 0 },
      { description: 'Transportation Charges', qty: 1, rate: p.cabs?.reduce((s, c) => s + (Number(c.km) || 0) * (Number(c.rate) || 0), 0) || 0, tax: 0 },
      ...(p.categories || []).map((c) => ({ description: c.name, qty: 1, rate: Number(c.amount) || 0, tax: 0 })),
    ].filter((it) => it.rate > 0))
    toast(`Items loaded from ${p.code}`)
  }

  /* picking a booking pulls its client + confirmed value */
  const loadFromBooking = (bid) => {
    const b = bookings.find((x) => x.id === bid)
    if (!b) { setF((s) => ({ ...s, bookingId: '' })); return }
    const pkg = packages.find((p) => p.id === b.packageId)
    setF((s) => ({ ...s, bookingId: bid, packageId: b.packageId || s.packageId, clientId: pkg?.clientId || s.clientId }))
    setItems([{ description: `Travel Package ${pkg?.code || b.code} — ${b.clientName}`, qty: 1, rate: b.value || 0, tax: 0 }])
    toast(`Loaded ${b.code} — ${inr(b.value || 0)}`)
  }

  const lineAmt = (it) => (Number(it.qty) || 0) * (Number(it.rate) || 0) * (1 + (Number(it.tax) || 0) / 100)
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)
  const tax = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0) * ((Number(it.tax) || 0) / 100), 0)
  const grand = subtotal + tax

  const create = async () => {
    if (!f.clientId) return toast('Pick a client first')
    const real = items.filter((it) => it.description.trim() && Number(it.rate) > 0)
    if (!real.length) return toast('Add at least one item with a description and rate')
    try {
      const rec = await addInvoice({ ...f, clientName: client?.name || 'Client', items: real.map((it) => ({ ...it, qty: Number(it.qty) || 1, rate: Number(it.rate), tax: Number(it.tax) || 0 })) })
      toast(`Invoice ${rec.code} created`)
      nav(`/app/invoices/${rec.id}`)
    } catch (ex) { toast(ex.message || 'Could not create the invoice') }
  }

  return (
    <div className="ic">
      <PageHeader title="Create Invoice" subtitle="Generate invoices for bookings, packages, or services — pick a package and the items fill themselves." />
      <div className="ic-grid">
        {/* ================= details ================= */}
        <div className="ic-main">
          <div className="ic-card">
            <div className="ic-card-title">Invoice Details</div>
            <div className="form-grid">
              <Field label="Client" required>
                <PillSelect value={f.clientId} options={['', ...clients.map((c) => c.id)]}
                  format={(id) => (id ? clients.find((c) => c.id === id)?.name : 'Select client')}
                  onChange={(id) => setF({ ...f, clientId: id, packageId: '', bookingId: '' })} />
              </Field>
              <Field label="Invoice Type">
                <PillSelect value={f.type} options={TYPES} onChange={(v) => setF({ ...f, type: v })} />
              </Field>
              <Field label="Related Package" hint="Optional — loads its costs as line items">
                <PillSelect value={f.packageId} options={['', ...pkgOptions.map((p) => p.id)]} format={pkgLabel} onChange={loadFromPackage} />
              </Field>
              <Field label="Related Booking" hint="Optional — pulls the confirmed booking value">
                <PillSelect value={f.bookingId} options={['', ...bkOptions.map((b) => b.id)]} format={bkLabel} onChange={loadFromBooking} />
              </Field>
              <Field label="Issue Date"><DatePicker value={f.issueDate} onChange={(v) => setF({ ...f, issueDate: v })} /></Field>
              <Field label="Due Date"><DatePicker value={f.dueDate} onChange={(v) => setF({ ...f, dueDate: v })} placeholder="Pick a due date" /></Field>
              <Field label="Tax Treatment">
                <div className="qs-toggle ic-gst">
                  <button className={`qs-pill ${!f.gst ? 'on' : ''}`} onClick={() => setF({ ...f, gst: false })}>Non-GST</button>
                  <button className={`qs-pill ${f.gst ? 'on' : ''}`} onClick={() => setF({ ...f, gst: true })}>GST</button>
                </div>
              </Field>
            </div>
          </div>

          {/* ================= items ================= */}
          <div className="ic-card">
            <div className="row-between">
              <div className="ic-card-title" style={{ marginBottom: 0 }}>Invoice Items</div>
              <Button size="sm" variant="secondary" onClick={addItem}>+ Add Item</Button>
            </div>
            <div className="ic-items">
              <div className="ic-items-head">
                <span>Description</span><span>Qty</span><span>Rate (₹)</span><span>Tax %</span><span className="r">Amount</span><span />
              </div>
              {items.map((it, i) => (
                <div className="ic-item" key={i}>
                  <Input value={it.description} placeholder={`e.g. Hotel & accommodation charges`} onChange={(e) => setItem(i, 'description', e.target.value)} />
                  <Input value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} />
                  <Input value={it.rate} placeholder="0" onChange={(e) => setItem(i, 'rate', e.target.value)} />
                  <Input value={it.tax} onChange={(e) => setItem(i, 'tax', e.target.value)} />
                  <span className="ic-amount">{inr(lineAmt(it))}</span>
                  <button className="ic-x" title="Remove item" onClick={() => rmItem(i)}><Icon name="trash" size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= summary ================= */}
        <div className="ic-side">
          <div className="ic-card">
            <div className="ic-card-title">Summary</div>
            {client && (
              <div className="ic-client">
                <span className="ic-client-av">{client.name.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                <div><div className="ic-client-n">{client.name}</div><div className="ic-client-s">{client.phone}</div></div>
              </div>
            )}
            <div className="ic-line"><span>Items</span><span>{items.filter((it) => it.description.trim()).length}</span></div>
            <div className="ic-line"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
            <div className="ic-line"><span>Tax</span><span>{inr(tax)}</span></div>
            <div className="ic-line total"><span>Total</span><span>{inr(grand)}</span></div>
            <div className="ic-gst-note">{f.gst ? `GST invoice — under GSTIN ${agency.gstin}` : 'Non-GST invoice'}</div>
            <Button className="w-full mt-base" onClick={create}>Create Invoice</Button>
            <Button variant="tertiary" className="w-full mt-xs" onClick={() => nav('/app/invoices')}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
