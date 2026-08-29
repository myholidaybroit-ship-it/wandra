import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, PillSelect, DataTable, Badge, ListSearch, ConfirmDelete } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import { downloadCsv } from '../../../utils/csv'

export default function CabList() {
  const { cabs, cabTypes, removeCab, toast } = useApp()
  const [q, setQ] = useState('')
  const [type, setType] = useState('All Types')
  // the filter offers every configured category plus anything already typed on
  // a record, so a custom vehicle type never becomes unfindable
  const typeOptions = [...new Set([...(cabTypes || []), ...cabs.map((c) => c.type).filter(Boolean)])]
  const rows = cabs.filter((c) => (type === 'All Types' || c.type === type) && (c.name + (c.contact || '') + (c.city || '')).toLowerCase().includes(q.toLowerCase()))

  const exportCsv = () => downloadCsv('cabs',
    ['Name', 'Type', 'AC', 'Capacity', 'City', 'Rate / km', 'Rate / day', 'Contact', 'Status'],
    rows.map((c) => [c.name, c.type, c.acType, c.capacity, c.city || '', c.ratePerKm, c.ratePerDay || 0, c.contact, c.status]))

  const columns = [
    { key: 'name', head: 'Vehicle', render: (r) => (
      <div className="row gap-sm">
        <span className="master-thumb" style={r.image ? { backgroundImage: `url("${r.image}")` } : undefined} />
        <div><span className="cell-strong">{r.name}</span><div className="cell-sub">{r.acType} · {Number(r.capacity) || 0} pax</div></div>
      </div>
    ) },
    { key: 'type', head: 'Type', render: (r) => <Badge tone="neutral">{r.type || 'Universal'}</Badge> },
    { key: 'city', head: 'City', render: (r) => <span className="cell-sub">{r.city || '—'}</span> },
    { key: 'ratePerDay', head: 'Rent / Day', align: 'right', render: (r) => <span className="cell-strong">{inr(r.ratePerDay || 0)}</span> },
    { key: 'contact', head: 'Contact', render: (r) => <span className="cell-sub">{r.contact}</span> },
    { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
    { key: 'actions', head: '', align: 'right', render: (r) => (
      <div className="row gap-xs end">
        <Link to={`/app/cabs/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link>
        <ConfirmDelete what={r.name} onConfirm={async () => { await removeCab(r.id); toast('Cab type deleted') }} />
      </div>
    ) },
  ]
  return (
    <div>
      <PageHeader title="Cab Types" subtitle="Fleet with a flat per-day rent — the builder auto-fills from here."
        actions={<><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><Link to="/app/cabs/new"><Button>+ Add New Cab Type</Button></Link></>} />
      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search cabs by name, contact…" count={rows.length} />
        <PillSelect value={type} options={['All Types', ...typeOptions]} onChange={setType} />
      </div>
      <DataTable columns={columns} rows={rows} empty="No cabs match." />
    </div>
  )
}
