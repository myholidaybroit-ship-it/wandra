import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, DataTable, Badge, Button, ConfirmDelete } from '../../../components/ui/UI'

export default function BookingList() {
  const { bookings, canSeePricing, removeBooking, toast } = useApp()
  const columns = [
    { key: 'code', head: 'Booking ID', render: (r) => <Link to={`/app/bookings/${r.id}`} className="cell-strong c-link mono">{r.code}</Link> },
    { key: 'clientName', head: 'Client' },
    { key: 'travelDate', head: 'Travel Date' },
    ...(canSeePricing ? [
      { key: 'value', head: 'Value', align: 'right', render: (r) => inr(r.value) },
      { key: 'paid', head: 'Paid', align: 'right', render: (r) => <span className="c-success">{inr(r.paid)}</span> },
      { key: 'balance', head: 'Balance', align: 'right', render: (r) => <span className="c-error">{inr(r.value - r.paid)}</span> },
    ] : []),
    { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
    { key: 'actions', head: '', align: 'right', render: (r) => (
      <div className="row gap-xs end">
        <Link to={`/app/bookings/${r.id}`}><Button variant="secondary" size="sm">Manage</Button></Link>
        <ConfirmDelete what={`${r.code} — ${r.clientName || 'booking'}`} onConfirm={async () => { await removeBooking(r.id); toast('Booking deleted') }} />
      </div>
    ) },
  ]
  return (
    <div>
      <PageHeader title="Bookings" subtitle="Confirmed trips, payments and balances." />
      <DataTable columns={columns} rows={bookings} empty="No bookings yet. Confirm a package to create one." />
    </div>
  )
}
