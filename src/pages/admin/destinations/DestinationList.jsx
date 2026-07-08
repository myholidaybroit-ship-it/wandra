import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Button, DataTable, Badge, PillSelect, ListSearch } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import { downloadCsv } from '../../../utils/csv'

export default function DestinationList() {
  const { destinations } = useApp()
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const rows = destinations.filter((d) =>
    (type === 'All' || (d.type || 'Domestic') === type) &&
    (d.name + d.location).toLowerCase().includes(q.toLowerCase()))

  const exportCsv = () => downloadCsv('destinations',
    ['Name', 'Type', 'Location', 'Features'],
    rows.map((d) => [d.name, d.type || 'Domestic', d.location, d.features]))

  const columns = [
    { key: 'name', head: 'Destination', render: (r) => (
      <div className="row gap-sm">
        <span className="master-thumb" style={r.image ? { backgroundImage: `url("${r.image}")` } : undefined} />
        <div><span className="cell-strong">{r.name}</span><div className="cell-sub">{r.location}</div></div>
      </div>
    ) },
    { key: 'type', head: 'Type', render: (r) => <Badge tone={r.type === 'International' ? 'info' : 'neutral'}>{r.type || 'Domestic'}</Badge> },
    { key: 'features', head: 'Features & Specialties', render: (r) => <span className="cell-sub">{r.features}</span> },
    { key: 'actions', head: '', align: 'right', render: (r) => <Link to={`/app/destinations/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link> },
  ]
  return (
    <div>
      <PageHeader title="Destinations" subtitle="The places your agency sells — photos flow into PDFs & the landing page."
        actions={<><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><Link to="/app/destinations/new"><Button>+ Add New Destination</Button></Link></>} />
      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search destinations…" count={rows.length} />
        <PillSelect value={type} options={['All', 'Domestic', 'International']} onChange={setType} format={(v) => (v === 'All' ? 'All types' : v)} />
      </div>
      <DataTable columns={columns} rows={rows} empty="No destinations match." />
    </div>
  )
}
