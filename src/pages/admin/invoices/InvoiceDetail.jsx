import { useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Select } from '../../../components/ui/UI'
import { downloadElementPdf } from '../../../utils/pdf'
import './invoice.css'

export default function InvoiceDetail() {
  const { id } = useParams()
  const { invoices, agency, clients, addPayment, toast } = useApp()
  const inv = invoices.find((i) => i.id === id)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const docRef = useRef(null)
  const download = async () => { if (!docRef.current) return; setBusy(true); try { await downloadElementPdf(docRef.current, `${inv.code}.pdf`) } finally { setBusy(false) } }
  const [pay, setPay] = useState({ amount: '', method: 'Online', reference: '', date: '2026-06-26' })
  if (!inv) return <div>Invoice not found.</div>
  const client = clients.find((c) => c.id === inv.clientId)
  const subtotal = inv.items.reduce((s, it) => s + it.qty * it.rate, 0)
  const tax = inv.items.reduce((s, it) => s + it.qty * it.rate * (it.tax / 100), 0)
  const total = subtotal + tax
  const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0)

  const record = () => {
    if (!pay.amount) return toast('Enter an amount')
    addPayment(inv.id, { ...pay, amount: Number(pay.amount) })
    toast('Payment processed and synchronized'); setOpen(false); setPay({ amount: '', method: 'Online', reference: '', date: '2026-06-26' })
  }

  return (
    <div>
      <PageHeader title={inv.code} subtitle={`${inv.clientName} · ${inv.type}`}
        actions={<>
          <Link to="/app/invoices"><Button variant="secondary" size="sm">← Back</Button></Link>
          <Button variant="secondary" size="sm" onClick={download} disabled={busy}>{busy ? 'Preparing…' : 'Download PDF'}</Button>
          <Link to={`/inv/${inv.code}`} target="_blank"><Button variant="secondary" size="sm">Share Link ↗</Button></Link>
          <Button size="sm" onClick={() => setOpen(true)}>+ Record Payment</Button>
        </>} />

      <div ref={docRef}>
      <Card pad={0}>
        <div className="inv-banner">
          <div><div className="inv-title">INVOICE</div><div className="mono inv-no">{inv.code}</div></div>
          <Badge tone={inv.status}>{inv.status}</Badge>
        </div>
        <div className="inv-body">
          <div className="grid grid-2">
            <div><div className="t-caption-upper c-muted">From</div><div className="t-title-sm mt-xs">{agency.name}</div><div className="t-body-sm c-body">{agency.address}</div><div className="t-body-sm c-body">{agency.gstin && `GSTIN: ${agency.gstin}`}</div></div>
            <div><div className="t-caption-upper c-muted">Bill To</div><div className="t-title-sm mt-xs">{inv.clientName}</div><div className="t-body-sm c-body">{client?.email}</div><div className="t-body-sm c-body">{client?.phone}</div></div>
          </div>
          <div className="row gap-xl mt-base t-body-sm c-body"><span>Issue Date: <strong className="c-ink">{inv.issueDate}</strong></span><span>Due Date: <strong className="c-ink">{inv.dueDate || '—'}</strong></span></div>

          <table className="data-table mt-lg" style={{ border: '1px solid var(--color-hairline)', borderRadius: 8 }}>
            <thead><tr><th>#</th><th>Description</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Tax</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {inv.items.map((it, i) => (
                <tr key={i}><td>{i + 1}</td><td>{it.description}</td><td style={{ textAlign: 'right' }}>{it.qty}</td><td style={{ textAlign: 'right' }}>{inr(it.rate)}</td><td style={{ textAlign: 'right' }}>{it.tax}%</td><td style={{ textAlign: 'right' }} className="cell-strong">{inr(it.qty * it.rate * (1 + it.tax / 100))}</td></tr>
              ))}
            </tbody>
          </table>

          <div className="inv-totals">
            <div className="fin-line"><span className="c-body">Subtotal</span><span>{inr(subtotal)}</span></div>
            <div className="fin-line"><span className="c-body">Tax</span><span>{inr(tax)}</span></div>
            <div className="fin-line total"><span>Total</span><span>{inr(total)}</span></div>
            <div className="fin-line"><span className="c-success">Paid</span><span className="c-success">{inr(paid)}</span></div>
            <div className="fin-line"><span className="c-error">Balance</span><span className="c-error">{inr(total - paid)}</span></div>
          </div>

          {inv.payments?.length > 0 && <>
            <div className="t-title-sm mt-lg mb-sm">Payment History</div>
            <table className="data-table" style={{ border: '1px solid var(--color-hairline)', borderRadius: 8 }}>
              <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
              <tbody>{inv.payments.map((p, i) => <tr key={i}><td>{p.date}</td><td>{p.method}</td><td className="mono cell-sub">{p.reference}</td><td style={{ textAlign: 'right' }} className="c-success">{inr(p.amount)}</td></tr>)}</tbody>
            </table>
          </>}
        </div>
      </Card>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Record Payment"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={record}>Save Payment</Button></>}>
        <div className="col gap-base">
          <Field label="Amount (₹)"><Input value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} placeholder="10000" /></Field>
          <Field label="Method"><Select value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })}><option>Online</option><option>Cash</option><option>Bank Transfer</option><option>UPI</option></Select></Field>
          <Field label="Transaction / Reference No."><Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} placeholder="TXN-77418" /></Field>
          <Field label="Date"><Input type="date" value={pay.date} onChange={(e) => setPay({ ...pay, date: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}
