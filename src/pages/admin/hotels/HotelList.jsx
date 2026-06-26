import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, FilterBar, Field, Input, DataTable } from '../../../components/ui/UI'

export default function HotelList() {
  const { hotels } = useApp()
  const [q, setQ] = useState('')
  const rows = hotels.filter((h) => (h.name + h.city).toLowerCase().includes(q.toLowerCase()))
  const columns = [
    { key: 'name', head: 'Hotel', render: (r) => <div><span className="cell-strong">{r.name}</span><div className="cell-sub">{r.roomTypes}</div></div> },
    { key: 'city', head: 'City' },
    { key: 'rating', head: 'Rating', render: (r) => <span>{'★'.repeat(r.rating)}<span className="c-muted">{'★'.repeat(5 - r.rating)}</span></span> },
    { key: 'buyingPrice', head: 'Buying Price / Night', align: 'right', render: (r) => <span className="cell-strong">{inr(r.buyingPrice)}</span> },
    { key: 'contact', head: 'Contact', render: (r) => <span className="cell-sub">{r.phone}</span> },
    { key: 'actions', head: '', align: 'right', render: (r) => <Link to={`/app/hotels/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link> },
  ]
  return (
    <div>
      <PageHeader title="Hotel Management" subtitle="Your affiliated hotels and their buying prices."
        counter={`Hotels ${hotels.length} / 20`}
        actions={<><Button variant="secondary">Export CSV</Button><Link to="/app/hotels/new"><Button>+ Add New Hotel</Button></Link></>} />
      <FilterBar><Field label="Search"><Input placeholder="Search hotels…" value={q} onChange={(e) => setQ(e.target.value)} /></Field></FilterBar>
      <DataTable columns={columns} rows={rows} />
    </div>
  )
}
