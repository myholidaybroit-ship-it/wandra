import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, FilterBar, Field, Input, PillSelect, DataTable, Badge } from '../../../components/ui/UI'
import { downloadCsv } from '../../../utils/csv'

export default function CabList() {
  const { cabs } = useApp()
  const [q, setQ] = useState('')
  const [type, setType] = useState('All Types')
  const rows = cabs.filter((c) => (type === 'All Types' || c.type === type) && (c.name + c.contact).toLowerCase().includes(q.toLowerCase()))

  const exportCsv = () => downloadCsv('cabs',
    ['Name', 'Type', 'AC', 'Capacity', 'Rate / km', 'Rate / day', 'Contact', 'Status'],
    rows.map((c) => [c.name, c.type, c.acType, c.capacity, c.ratePerKm, c.ratePerDay || 0, c.contact, c.status]))

  const columns = [
    { key: 'name', head: 'Vehicle', render: (r) => (
      <div className="row gap-sm">
        <span className="master-thumb" style={r.image ? { backgroundImage: `url("${r.image}")` } : undefined} />
        <div><span className="cell-strong">{r.name}</span><div className="cell-sub">{r.acType} · {r.capacity} pax</div></div>
      </div>
    ) },
    { key: 'type', head: 'Type', render: (r) => <Badge tone="neutral">{r.type}</Badge> },
    { key: 'ratePerKm', head: 'Rate / KM', align: 'right', render: (r) => inr(r.ratePerKm) },
    { key: 'ratePerDay', head: 'Rate / Day', align: 'right', render: (r) => <span className="cell-strong">{inr(r.ratePerDay || 0)}</span> },
    { key: 'contact', head: 'Contact', render: (r) => <span className="cell-sub">{r.contact}</span> },
    { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
    { key: 'actions', head: '', align: 'right', render: (r) => <Link to={`/app/cabs/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link> },
  ]
  return (
    <div>
      <PageHeader title="Cabs & Vehicles" subtitle="Fleet with per-km and per-day rates — the builder auto-fills from here."
        counter={`Cabs ${cabs.length}`}
        actions={<><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><Link to="/app/cabs/new"><Button>+ Add New Cab</Button></Link></>} />
      <FilterBar>
        <Field label="Search"><Input placeholder="Search cabs by name, contact…" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
        <Field label="Type"><PillSelect value={type} options={['All Types', 'Sedan', 'SUV', 'Tempo Traveller']} onChange={setType} /></Field>
      </FilterBar>
      <DataTable columns={columns} rows={rows} empty="No cabs match." />
    </div>
  )
}
