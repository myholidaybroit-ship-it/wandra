import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, DataTable, ListSearch } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import { downloadCsv } from '../../../utils/csv'

export default function HotelList() {
  const { hotels } = useApp()
  const [q, setQ] = useState('')
  const rows = hotels.filter((h) => (h.name + h.city).toLowerCase().includes(q.toLowerCase()))

  const exportCsv = () => downloadCsv('hotels',
    ['Name', 'City', 'Rating', 'Buying price / night', 'Extra bed adult', 'Extra bed child', 'Child no bed', 'Room types', 'Phone'],
    rows.map((h) => [h.name, h.city, h.rating, h.buyingPrice, h.extraBedAdult || 0, h.extraBedChild || 0, h.childNoBed || 0, h.roomTypes, h.phone]))

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
    { key: 'actions', head: '', align: 'right', render: (r) => <Link to={`/app/hotels/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link> },
  ]
  return (
    <div>
      <PageHeader title="Hotels" subtitle="Affiliated hotels — base & bed rates feed straight into quote pricing."
        actions={<><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><Link to="/app/hotels/new"><Button>+ Add New Hotel</Button></Link></>} />
      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search hotels…" count={rows.length} />
      </div>
      <DataTable columns={columns} rows={rows} empty="No hotels match." />
    </div>
  )
}
