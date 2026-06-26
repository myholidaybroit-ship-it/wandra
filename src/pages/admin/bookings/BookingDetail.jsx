import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Select, DataTable } from '../../../components/ui/UI'
import '../packages/detail.css'

export default function BookingDetail() {
  const { id } = useParams()
  const { bookings, packages, addBookingPayment, setBookingStatus, toast } = useApp()
  const bk = bookings.find((b) => b.id === id)
  const [open, setOpen] = useState(false)
  const [pay, setPay] = useState({ amount: '', method: 'Online', reference: '', date: '2026-06-26' })
  if (!bk) return <div>Booking not found.</div>
  const pkg = packages.find((p) => p.id === bk.packageId)
  const balance = bk.value - bk.paid

  const record = () => {
    if (!pay.amount) return toast('Enter an amount')
    addBookingPayment(bk.id, { ...pay, amount: Number(pay.amount) })
    toast('Payment recorded'); setOpen(false); setPay({ amount: '', method: 'Online', reference: '', date: '2026-06-26' })
  }

  const dayRows = (pkg?.itinerary || []).flatMap((d) => (d.stops || []).filter((s) => s.destination).map((s) => ({ id: `${d.day}-${s.destination}`, day: d.day, destination: s.destination, date: s.date, activity: s.activity })))

  return (
    <div>
      <PageHeader title={bk.code} subtitle={`${bk.clientName} · Travel ${bk.travelDate}`}
        actions={<>
          <Link to="/app/bookings"><Button variant="secondary" size="sm">← Back</Button></Link>
          <Select value={bk.status} onChange={(e) => { setBookingStatus(bk.id, e.target.value); toast(`Booking ${e.target.value}`) }} style={{ height: 32, width: 'auto' }}>
            <option>Active</option><option>Muted</option><option>Completed</option><option>Cancelled</option>
          </Select>
          <Button size="sm" onClick={() => setOpen(true)}>+ Add Payment</Button>
          <Link to={`/app/invoices/new?booking=${bk.id}`}><Button size="sm" variant="secondary">Create Invoice</Button></Link>
        </>} />

      <div className="detail-grid">
        <div className="col gap-lg">
          <Card>
            <div className="row-between"><span className="t-title-md">Booking Overview</span><Badge tone={bk.status}>{bk.status}</Badge></div>
            <hr className="divider" />
            <div className="fin-line"><span className="c-body">Linked Package</span>{pkg ? <Link className="c-link mono" to={`/app/packages/${pkg.id}`}>{pkg.code}</Link> : '—'}</div>
            <div className="fin-line"><span className="c-body">Total Value</span><span className="cell-strong">{inr(bk.value)}</span></div>
            <div className="fin-line"><span className="c-success">Paid</span><span className="c-success">{inr(bk.paid)}</span></div>
            <div className="fin-line"><span className="c-error">Balance Due</span><span className="c-error">{inr(balance)}</span></div>
          </Card>

          <Card>
            <span className="t-title-md">Day-wise Destinations</span>
            <hr className="divider" />
            <DataTable columns={[
              { key: 'day', head: 'Day', render: (r) => <span className="day-badge">Day {r.day}</span> },
              { key: 'destination', head: 'Destination', render: (r) => <span className="cell-strong">{r.destination}</span> },
              { key: 'date', head: 'Date', render: (r) => r.date || '—' },
              { key: 'activity', head: 'Activity', render: (r) => <span className="cell-sub">{r.activity}</span> },
            ]} rows={dayRows} empty="No itinerary stops." />
          </Card>

          <Card>
            <span className="t-title-md">Payment History</span>
            <hr className="divider" />
            {(bk.payments || []).length === 0 && <div className="t-body-sm c-muted">No payments recorded yet.</div>}
            {(bk.payments || []).map((p, i) => (
              <div className="fin-line" key={i}><span className="c-body">{p.date} · {p.method} <span className="mono cell-sub">{p.reference}</span></span><span className="c-success">{inr(p.amount)}</span></div>
            ))}
          </Card>
        </div>

        <Card className="fin-card">
          <span className="t-title-md">Collection</span>
          <hr className="divider" />
          <div className="fin-bar" style={{ height: 10, background: 'var(--color-surface-strong)', borderRadius: 9999, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (bk.paid / (bk.value || 1)) * 100)}%`, background: 'var(--color-success)' }} />
          </div>
          <div className="t-caption c-muted mt-xs">{Math.round((bk.paid / (bk.value || 1)) * 100)}% collected</div>
          <Button className="w-full mt-base" onClick={() => setOpen(true)}>+ Add Payment</Button>
        </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Payment"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={record}>Save Payment</Button></>}>
        <div className="col gap-base">
          <Field label="Amount (₹)"><Input value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Method"><Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}><option>Online</option><option>Cash</option><option>Bank Transfer</option><option>UPI</option></Select></Field>
          <Field label="Reference No."><Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
          <Field label="Date"><Input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}
