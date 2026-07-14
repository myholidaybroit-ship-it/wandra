import { useNavigate, Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, DataTable, Badge, Button, ConfirmDelete } from '../../../components/ui/UI'
import { downloadCsv } from '../../../utils/csv'

export default function QuotationList() {
  const { quotations, packages, setQuotationStatus, removeQuotation, createBookingFromPackage, toast, canSeePricing } = useApp()
  const nav = useNavigate()

  const exportCsv = () => {
    const headers = ['Package ID', 'Client', 'Travel Date', ...(canSeePricing ? ['Amount'] : []), 'Status']
    const data = quotations.map((r) => [
      r.packageCode || '', r.client || '', r.travelDate || '',
      ...(canSeePricing ? [r.amount || 0] : []), r.status || '',
    ])
    downloadCsv('quotations', headers, data)
  }

  const convert = async (q) => {
    const pkg = packages.find((p) => p.id === q.packageId)
    if (!pkg) return toast('Package not found')
    try {
      const b = await createBookingFromPackage(pkg)
      await setQuotationStatus(q.id, 'Confirmed')
      toast('Quotation converted to booking')
      nav(`/app/bookings/${b.id}`)
    } catch (ex) { toast(ex.message || 'Could not convert the quotation') }
  }

  const columns = [
    { key: 'packageCode', head: 'Package ID', render: (r) => <Link className="mono cell-strong c-link" to={`/app/packages/${r.packageId}`}>{r.packageCode}</Link> },
    { key: 'client', head: 'Client' },
    { key: 'travelDate', head: 'Travel Date', render: (r) => r.travelDate || '—' },
    ...(canSeePricing ? [{ key: 'amount', head: 'Amount', align: 'right', render: (r) => <span className="cell-strong">{inr(r.amount)}</span> }] : []),
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
        <ConfirmDelete what={`quotation ${r.packageCode || ''}`.trim()} onConfirm={async () => { await removeQuotation(r.id); toast('Quotation deleted') }} />
      </div>
    ) },
  ]
  return (
    <div>
      <PageHeader title="Quotations" subtitle="Manage client quotations generated from packages."
        actions={<Button variant="secondary" onClick={exportCsv} disabled={!quotations.length}>Export CSV</Button>} />
      <DataTable columns={columns} rows={quotations} />
    </div>
  )
}
