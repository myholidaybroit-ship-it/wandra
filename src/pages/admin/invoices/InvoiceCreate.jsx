import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Select } from '../../../components/ui/UI'

export default function InvoiceCreate() {
  const { clients, packages, bookings, addInvoice, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ clientId: '', type: 'Booking', bookingId: '', packageId: '', issueDate: '2026-06-26', dueDate: '', gst: false })
  const [items, setItems] = useState([{ description: '', qty: 1, rate: 0, tax: 0 }])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const setItem = (i, k, v) => setItems(items.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const addItem = () => setItems([...items, { description: '', qty: 1, rate: 0, tax: 0 }])
  const rmItem = (i) => setItems(items.filter((_, idx) => idx !== i))

  const loadFromPackage = (pid) => {
    const p = packages.find((x) => x.id === pid)
    if (!p) return
    setItems([
      { description: `Package Cost - ${p.clientName}`, qty: 1, rate: Number(p.pricing?.packageCost) || 0, tax: 0 },
      { description: 'Hotel & Accommodation Charges', qty: 1, rate: p.hotelsAlloc?.reduce((s, h) => s + Number(h.price || 0), 0) || 0, tax: 0 },
      { description: 'Transportation Charges', qty: 1, rate: p.cabs?.reduce((s, c) => s + c.km * c.rate, 0) || 0, tax: 0 },
      ...(p.categories || []).map((c) => ({ description: c.name, qty: 1, rate: Number(c.amount) || 0, tax: 0 })),
    ])
    setF((s) => ({ ...s, packageId: pid, clientId: p.clientId }))
  }

  const subtotal = items.reduce((s, it) => s + it.qty * it.rate, 0)
  const tax = items.reduce((s, it) => s + it.qty * it.rate * (it.tax / 100), 0)
  const grand = subtotal + tax

  const create = () => {
    const client = clients.find((c) => c.id === f.clientId)
    const rec = addInvoice({ ...f, clientName: client?.name || 'Client', items: items.map((it) => ({ ...it, qty: Number(it.qty), rate: Number(it.rate), tax: Number(it.tax) })) })
    toast('Invoice created'); nav(`/app/invoices/${rec.id}`)
  }

  return (
    <div>
      <PageHeader title="Create Invoice" subtitle="Generate invoices for bookings, packages, or services." />
      <div className="detail-grid">
        <Card>
          <span className="t-title-md">Invoice Details</span>
          <hr className="divider" />
          <div className="form-grid">
            <Field label="Client"><Select value={f.clientId} onChange={set('clientId')}><option value="">Select client</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
            <Field label="Invoice Type"><Select value={f.type} onChange={set('type')}><option>Booking</option><option>Package</option><option>Service</option></Select></Field>
            <Field label="Related Package (optional)"><Select value={f.packageId} onChange={(e) => loadFromPackage(e.target.value)}><option value="">None</option>{packages.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}</Select></Field>
            <Field label="Related Booking (optional)"><Select value={f.bookingId} onChange={set('bookingId')}><option value="">None</option>{bookings.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}</Select></Field>
            <Field label="Issue Date"><Input type="date" value={f.issueDate} onChange={set('issueDate')} /></Field>
            <Field label="Due Date"><Input type="date" value={f.dueDate} onChange={set('dueDate')} /></Field>
            <Field label="GST Invoice?"><Select value={f.gst} onChange={(e) => setF({ ...f, gst: e.target.value === 'true' })}><option value="false">Non-GST</option><option value="true">GST</option></Select></Field>
          </div>

          <div className="row-between mt-lg"><span className="t-title-sm">Invoice Items</span><Button size="sm" variant="secondary" onClick={addItem}>+ Add Item</Button></div>
          <div className="mt-sm">
            {items.map((it, i) => (
              <div className="alloc-row" key={i} style={{ gridTemplateColumns: '2fr .6fr 1fr .7fr auto' }}>
                <Field label="Description"><Input value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Item description" /></Field>
                <Field label="Qty"><Input value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} /></Field>
                <Field label="Rate"><Input value={it.rate} onChange={(e) => setItem(i, 'rate', e.target.value)} /></Field>
                <Field label="Tax %"><Input value={it.tax} onChange={(e) => setItem(i, 'tax', e.target.value)} /></Field>
                <Button variant="danger" size="sm" onClick={() => rmItem(i)}>🗑</Button>
              </div>
            ))}
          </div>
          <div className="row gap-sm mt-base"><Button onClick={create}>Create Invoice</Button><Button variant="secondary" onClick={() => nav('/app/invoices')}>Cancel</Button></div>
        </Card>

        <Card className="fin-card">
          <span className="t-title-md">Financial Summary</span>
          <hr className="divider" />
          <div className="fin-line"><span className="c-body">Subtotal</span><span>{inr(subtotal)}</span></div>
          <div className="fin-line"><span className="c-body">Tax</span><span>{inr(tax)}</span></div>
          <hr className="divider" />
          <div className="fin-line total"><span>Total</span><span>{inr(grand)}</span></div>
        </Card>
      </div>
    </div>
  )
}
