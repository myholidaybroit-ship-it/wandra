import { useNavigate, Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, DataTable, Badge, Button } from '../../../components/ui/UI'

export default function QuotationList() {
  const { quotations, packages, setQuotationStatus, createBookingFromPackage, toast } = useApp()
  const nav = useNavigate()

  const convert = (q) => {
    const pkg = packages.find((p) => p.id === q.packageId)
    if (!pkg) return toast('Package not found')
    const b = createBookingFromPackage(pkg)
    setQuotationStatus(q.id, 'Confirmed')
    toast('Quotation converted to booking')
    nav(`/app/bookings/${b.id}`)
  }

  const columns = [
    { key: 'packageCode', head: 'Package ID', render: (r) => <Link className="mono cell-strong c-link" to={`/app/packages/${r.packageId}`}>{r.packageCode}</Link> },
    { key: 'client', head: 'Client' },
    { key: 'travelDate', head: 'Travel Date', render: (r) => r.travelDate || '—' },
    { key: 'amount', head: 'Amount', align: 'right', render: (r) => <span className="cell-strong">{inr(r.amount)}</span> },
    { key: 'status', head: 'Status', render: (r) => (
      r.status === 'Confirmed'
        ? <Badge tone="confirmed">Confirmed</Badge>
        : <div className="qs-toggle">
            {['Draft', 'Sent'].map((s) => (
              <button key={s} className={`qs-pill ${r.status === s ? 'on' : ''}`}
                onClick={() => { setQuotationStatus(r.id, s); toast(`Quotation marked ${s}`) }}>{s}</button>
            ))}
          </div>
    ) },
    { key: 'actions', head: '', align: 'right', render: (r) => (
      <div className="row-actions">
        <Link to={`/i/${r.packageCode}`} target="_blank"><Button variant="secondary" size="sm">Preview</Button></Link>
        {r.status !== 'Confirmed' && <Button size="sm" onClick={() => convert(r)}>Convert → Booking</Button>}
      </div>
    ) },
  ]
  return (
    <div>
      <PageHeader title="Quotations" subtitle="Manage client quotations generated from packages."
        actions={<Button variant="secondary">Export CSV</Button>} />
      <DataTable columns={columns} rows={quotations} />
    </div>
  )
}
