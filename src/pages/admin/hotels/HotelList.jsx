import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, DataTable, ListSearch, ConfirmDelete, DestGroup, groupByDestination } from '../../../components/ui/UI'
import { downloadCsv } from '../../../utils/csv'

export default function HotelList() {
  const { hotels, destinations, removeHotel, toast } = useApp()
  const [q, setQ] = useState('')
  const rows = hotels.filter((h) => (h.name + h.city + (h.destination || '')).toLowerCase().includes(q.toLowerCase()))
  const groups = groupByDestination(rows, destinations)

  const exportCsv = () => downloadCsv('hotels',
    ['Name', 'Destination', 'City', 'Rating', 'Buying price / night', 'Extra bed adult', 'Extra bed child', 'Child no bed', 'Room types', 'Phone'],
    rows.map((h) => [h.name, h.destination || '', h.city, h.rating, h.buyingPrice, h.extraBedAdult || 0, h.extraBedChild || 0, h.childNoBed || 0, h.roomTypes, h.phone]))

  const columns = [
    { key: 'name', head: 'Hotel', render: (r) => (
      <div className="row gap-sm">
        <span className="master-thumb" style={r.image ? { backgroundImage: `url("${r.image}")` } : undefined} />
        <div><span className="cell-strong">{r.name}</span><div className="cell-sub">{r.roomTypes}</div></div>
      </div>
    ) },
    { key: 'city', head: 'City' },
    { key: 'rating', head: 'Rating', render: (r) => <span>{'★'.repeat(r.rating)}<span className="c-muted">{'★'.repeat(5 - r.rating)}</span></span> },
    { key: 'buyingPrice', head: 'Buying / Night', align: 'right', render: (r) => <span className="cell-strong">{inr(r.buyingPrice)}</span> },
    { key: 'beds', head: 'Extra Beds (A/C/CNB)', align: 'right', render: (r) => <span className="cell-sub">{inr(r.extraBedAdult || 0)} · {inr(r.extraBedChild || 0)} · {inr(r.childNoBed || 0)}</span> },
    { key: 'actions', head: '', align: 'right', render: (r) => (
      <div className="row gap-xs end">
        <Link to={`/app/hotels/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link>
        <ConfirmDelete what={r.name} onConfirm={async () => { await removeHotel(r.id); toast('Hotel deleted') }} />
      </div>
    ) },
  ]
  return (
    <div>
      <PageHeader title="Hotels" subtitle="Affiliated hotels — base & bed rates feed straight into quote pricing."
        actions={<><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><Link to="/app/hotels/new"><Button>+ Add New Hotel</Button></Link></>} />
      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search hotels…" count={rows.length} />
      </div>
      {groups.map((g) => (
        <DestGroup key={g.key} name={g.name} location={g.location} image={g.image} count={g.records.length}
          actions={<Link to={`/app/hotels/new${g.key !== '__none__' ? `?destination=${encodeURIComponent(g.name)}` : ''}`}><Button variant="secondary" size="sm">+ Add here</Button></Link>}>
          <DataTable columns={columns} rows={g.records} />
        </DestGroup>
      ))}
      {groups.length === 0 && <DataTable columns={columns} rows={[]} empty="No hotels yet — add your first one." />}
    </div>
  )
}
