import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, FilterBar, Field, Input, Select, DataTable, Badge } from '../../../components/ui/UI'

export default function CabList() {
  const { cabs } = useApp()
  const [q, setQ] = useState('')
  const [type, setType] = useState('All Types')
  const rows = cabs.filter((c) => (type === 'All Types' || c.type === type) && (c.name + c.contact).toLowerCase().includes(q.toLowerCase()))
  const columns = [
    { key: 'name', head: 'Name', render: (r) => <span className="cell-strong">{r.name}</span> },
    { key: 'type', head: 'Type', render: (r) => <Badge tone="info">{r.type}</Badge> },
    { key: 'acType', head: 'AC', render: (r) => <Badge tone="neutral">{r.acType}</Badge> },
    { key: 'capacity', head: 'Capacity', render: (r) => `${r.capacity} pax` },
    { key: 'ratePerKm', head: 'Rate / KM', align: 'right', render: (r) => <span className="cell-strong">{inr(r.ratePerKm)}</span> },
    { key: 'contact', head: 'Contact', render: (r) => <span className="cell-sub">{r.contact}</span> },
    { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
    { key: 'actions', head: '', align: 'right', render: (r) => <Link to={`/app/cabs/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link> },
  ]
  return (
    <div>
      <PageHeader title="Cab Management" subtitle="Manage cab inventory and transportation."
        counter={`Cabs ${cabs.length} / 20`}
        actions={<><Button variant="secondary">Export CSV</Button><Link to="/app/cabs/new"><Button>+ Add New Cab</Button></Link></>} />
      <FilterBar>
        <Field label="Search"><Input placeholder="Search cabs by name, contact…" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
        <Field label="Type"><Select value={type} onChange={(e) => setType(e.target.value)}><option>All Types</option><option>Sedan</option><option>SUV</option><option>Tempo Traveller</option></Select></Field>
      </FilterBar>
      <DataTable columns={columns} rows={rows} />
    </div>
  )
}
