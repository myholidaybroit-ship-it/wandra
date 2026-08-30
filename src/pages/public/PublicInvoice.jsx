import { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { inr, setActiveCurrency, DEFAULT_INVOICE_SETTINGS } from '../../store/AppContext'
import { usePublic } from '../../hooks/usePublic'
import { Card, Button, Badge } from '../../components/ui/UI'
import { AgencyLogo } from '../../components/ui/AgencyBrand'
import { PayTo } from '../../components/ui/PayTo'
import { invoiceBreakup } from '../../utils/invoiceMath'
import { preloadAndDownload } from '../../utils/pdf'
import '../admin/invoices/invoice.css'

export default function PublicInvoice() {
  const { code } = useParams()
  const { data, loading } = usePublic(`/invoice/${code}`)
  const inv = data?.invoice
  const agency = data?.agency || {}
  const docRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const download = async () => { if (!docRef.current) return; setBusy(true); try { await preloadAndDownload(docRef.current, `${inv.code}.pdf`) } finally { setBusy(false) } }
  if (loading) return <div className="section">Loading invoice…</div>
  if (!inv) return <div className="section">Invoice not found.</div>
  if (agency.currency) setActiveCurrency(agency.currency)   // public page: money follows the agency's currency
  const client = { name: inv.clientName }
  const { subtotal, itemTax, gst, tcs, total, paid } = invoiceBreakup(inv)
  const gstPct = Number(inv.gstPercent) || Math.max(0, ...inv.items.map((it) => Number(it.tax) || 0))
  const invSettings = { ...DEFAULT_INVOICE_SETTINGS, ...(agency.invoiceSettings || {}) }
  return (
    <div className="section" style={{ maxWidth: 820, margin: '0 auto' }}>
      <div ref={docRef}>
      <Card pad={0}>
        <div className="inv-banner"><div><div className="inv-title">INVOICE</div><div className="mono inv-no">{inv.code}</div></div><Badge tone={inv.status}>{inv.status}</Badge></div>
        <div className="inv-body">
          <div className="grid grid-2">
            <div><AgencyLogo agency={agency} className="inv-agency-logo" fallback="name" /><div className="t-caption-upper c-muted">From</div><div className="t-title-sm mt-xs">{agency.legalName || agency.name}</div>{agency.legalName && agency.legalName !== agency.name && <div className="t-body-sm c-body">T/A {agency.name}</div>}<div className="t-body-sm c-body">{agency.address}</div><div className="t-body-sm c-body">{agency.gstin && `GSTIN: ${agency.gstin}`}</div></div>
            <div><div className="t-caption-upper c-muted">Bill To</div><div className="t-title-sm mt-xs">{inv.clientName}</div><div className="t-body-sm c-body">{client?.phone}</div></div>
          </div>
          <table className="data-table mt-lg" style={{ border: '1px solid var(--color-hairline)', borderRadius: 8 }}>
            <thead><tr><th>Description</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>{inv.items.map((it, i) => <tr key={i}><td>{it.description}</td><td style={{ textAlign: 'right' }}>{it.qty}</td><td style={{ textAlign: 'right' }}>{inr(it.rate)}</td><td style={{ textAlign: 'right' }} className="cell-strong">{inr(it.qty * it.rate * (1 + it.tax / 100))}</td></tr>)}</tbody>
          </table>
          <div className="inv-totals">
            <div className="fin-line"><span className="c-body">Subtotal</span><span>{inr(subtotal)}</span></div>
            {(inv.gst || gst > 0)
              ? <div className="fin-line"><span className="c-body">GST{gstPct ? ` (${gstPct}%)` : ''}</span><span>{inr(gst + itemTax)}</span></div>
              : itemTax > 0 && <div className="fin-line"><span className="c-body">Tax</span><span>{inr(itemTax)}</span></div>}
            {(inv.tcs || tcs > 0) && (
              <div className="fin-line"><span className="c-body">TCS{Number(inv.tcsPercent) ? ` (${Number(inv.tcsPercent)}%)` : ''}</span><span>{inr(tcs)}</span></div>
            )}
            <div className="fin-line total"><span>Total</span><span>{inr(total)}</span></div>
            <div className="fin-line"><span className="c-success">Paid</span><span className="c-success">{inr(paid)}</span></div>
            <div className="fin-line"><span className="c-error">Balance</span><span className="c-error">{inr(total - paid)}</span></div>
          </div>
          <PayTo agency={agency} />
          {(invSettings.terms || invSettings.footer) && (
            <div className="inv-terms">
              {invSettings.terms && <div><strong>Payment Terms</strong><p>{invSettings.terms}</p></div>}
              {invSettings.footer && <p>{invSettings.footer}</p>}
            </div>
          )}
          <div className="pdf-powered" style={{ marginTop: 24 }}>Powered by <strong>Wandra</strong></div>
          <div className="row gap-sm center mt-lg no-print"><Button onClick={download} disabled={busy}>{busy ? 'Preparing…' : 'Download PDF'}</Button></div>
        </div>
      </Card>
      </div>
    </div>
  )
}
