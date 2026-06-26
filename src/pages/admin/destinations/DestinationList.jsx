import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Button, FilterBar, Field, Input, DataTable } from '../../../components/ui/UI'

export default function DestinationList() {
  const { destinations } = useApp()
  const [q, setQ] = useState('')
  const rows = destinations.filter((d) => (d.name + d.location).toLowerCase().includes(q.toLowerCase()))
  const columns = [
    { key: 'name', head: 'Destination', render: (r) => <span className="cell-strong">{r.name}</span> },
    { key: 'location', head: 'Location' },
    { key: 'features', head: 'Features & Specialties', render: (r) => <span className="cell-sub">{r.features}</span> },
    { key: 'actions', head: '', align: 'right', render: (r) => <Link to={`/app/destinations/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link> },
  ]
  return (
    <div>
      <PageHeader title="Destinations" subtitle="Manage the destinations your agency offers."
        counter={`Destinations ${destinations.length} / 20`}
        actions={<><Button variant="secondary">Export CSV</Button><Link to="/app/destinations/new"><Button>+ Add New Destination</Button></Link></>} />
      <FilterBar><Field label="Search"><Input placeholder="Search destinations…" value={q} onChange={(e) => setQ(e.target.value)} /></Field></FilterBar>
      <DataTable columns={columns} rows={rows} />
    </div>
  )
}
