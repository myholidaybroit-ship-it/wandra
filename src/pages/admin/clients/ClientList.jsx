import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, FilterBar, Field, Input, Select, DataTable, Badge } from '../../../components/ui/UI'

export default function ClientList() {
  const { clients } = useApp()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const rows = clients.filter((c) =>
    (status === 'All' || c.status === status) &&
    (c.name + c.email + c.phone).toLowerCase().includes(q.toLowerCase())
  )

  const columns = [
    { key: 'code', head: 'Client Code', render: (r) => <span className="mono cell-sub">{r.code}</span> },
    { key: 'name', head: 'Name', render: (r) => <span className="cell-strong">{r.name}</span> },
    { key: 'contact', head: 'Contact', render: (r) => <div><div>{r.phone}</div><div className="cell-sub">{r.email}</div></div> },
    { key: 'crm', head: 'CRM', render: (r) => <div className="col gap-xxs"><Badge tone={r.leadTemp}>{r.leadTemp}</Badge><span className="cell-sub">{r.note}</span></div> },
    { key: 'interest', head: 'Lead Interest', render: (r) => <div><div>{r.interest}</div><div className="cell-sub">{inr(r.budget)}</div></div> },
    { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
    { key: 'created', head: 'Created', render: (r) => <span className="cell-sub">{r.createdAt}</span> },
    { key: 'actions', head: '', align: 'right', render: (r) => <div className="row-actions"><Link to={`/app/clients/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link></div> },
  ]

  return (
    <div>
      <PageHeader
        title="Client Management"
        subtitle="Manage your client database and customer information."
        counter={`Clients ${clients.length} / 20`}
        actions={<>
          <Link to="/app/clients/lead-form"><Button variant="secondary">Lead Capture Form</Button></Link>
          <Button variant="secondary">Export CSV</Button>
          <Link to="/app/clients/new"><Button>+ Add New Client</Button></Link>
        </>}
      />
      <FilterBar>
        <Field label="Search"><Input placeholder="Name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option><option>Active</option><option>Inactive</option>
          </Select>
        </Field>
        <Field label="Lead Type"><Select><option>All Types</option><option>Hot</option><option>Warm</option><option>Cold</option></Select></Field>
        <Field label="Source"><Select><option>All Sources</option><option>Ad Form</option><option>Referral</option><option>Walk-in</option></Select></Field>
        <Button variant="ghost">Apply Filters</Button>
      </FilterBar>
      <DataTable columns={columns} rows={rows} empty="No clients match your filters." />
    </div>
  )
}
