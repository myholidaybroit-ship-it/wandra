import { useParams } from 'react-router-dom'
import { useApp, inr } from '../../store/AppContext'
import { Card, Button, Badge } from '../../components/ui/UI'
import '../admin/invoices/invoice.css'

export default function PublicInvoice() {
  const { code } = useParams()
  const { invoices, agency, clients } = useApp()
  const inv = invoices.find((i) => i.code === code) || invoices[0]
  if (!inv) return <div className="section">Invoice not found.</div>
  const client = clients.find((c) => c.id === inv.clientId)
  const subtotal = inv.items.reduce((s, it) => s + it.qty * it.rate, 0)
  const tax = inv.items.reduce((s, it) => s + it.qty * it.rate * (it.tax / 100), 0)
  const total = subtotal + tax
  const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0)
  return (
    <div className="section" style={{ maxWidth: 820, margin: '0 auto' }}>
      <Card pad={0}>
        <div className="inv-banner"><div><div className="inv-title">INVOICE</div><div className="mono inv-no">{inv.code}</div></div><Badge tone={inv.status}>{inv.status}</Badge></div>
        <div className="inv-body">
          <div className="grid grid-2">
            <div><div className="t-caption-upper c-muted">From</div><div className="t-title-sm mt-xs">{agency.name}</div><div className="t-body-sm c-body">{agency.address}</div></div>
            <div><div className="t-caption-upper c-muted">Bill To</div><div className="t-title-sm mt-xs">{inv.clientName}</div><div className="t-body-sm c-body">{client?.phone}</div></div>
          </div>
          <table className="data-table mt-lg" style={{ border: '1px solid var(--color-hairline)', borderRadius: 8 }}>
            <thead><tr><th>Description</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>{inv.items.map((it, i) => <tr key={i}><td>{it.description}</td><td style={{ textAlign: 'right' }}>{it.qty}</td><td style={{ textAlign: 'right' }}>{inr(it.rate)}</td><td style={{ textAlign: 'right' }} className="cell-strong">{inr(it.qty * it.rate * (1 + it.tax / 100))}</td></tr>)}</tbody>
          </table>
          <div className="inv-totals">
            <div className="fin-line total"><span>Total</span><span>{inr(total)}</span></div>
            <div className="fin-line"><span className="c-success">Paid</span><span className="c-success">{inr(paid)}</span></div>
            <div className="fin-line"><span className="c-error">Balance</span><span className="c-error">{inr(total - paid)}</span></div>
          </div>
          <div className="row gap-sm center mt-lg"><Button onClick={() => window.print()}>Print / Download PDF</Button></div>
        </div>
      </Card>
    </div>
  )
}
