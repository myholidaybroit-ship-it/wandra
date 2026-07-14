import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr, computePricing } from '../../../store/AppContext'
import { PageHeader, Button, FilterBar, Field, Input, Select, DataTable, Badge, ConfirmDelete } from '../../../components/ui/UI'
import { downloadCsv } from '../../../utils/csv'

export default function PackageList() {
  const { packages, canSeePricing, removePackage, toast } = useApp()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const rows = packages.filter((p) => (status === 'All' || p.status === status) && (p.code + p.clientName + p.destination).toLowerCase().includes(q.toLowerCase()))

  const exportCsv = () => {
    const headers = ['Package ID', 'Client', 'Destination', 'Days', 'Nights', 'Status', ...(canSeePricing ? ['Total'] : [])]
    const data = rows.map((r) => [
      r.code || '', r.clientName || '', r.destination || '', r.days || '', r.nights || '', r.status || '',
      ...(canSeePricing ? [computePricing(r).grandTotal] : []),
    ])
    downloadCsv('packages', headers, data)
  }
  const columns = [
    { key: 'code', head: 'Package ID', render: (r) => <Link to={`/app/packages/${r.id}`} className="cell-strong c-link mono">{r.code}</Link> },
    { key: 'clientName', head: 'Client' },
    { key: 'destination', head: 'Destination', render: (r) => <span className="cell-sub">{r.destination}</span> },
    { key: 'days', head: 'Duration', render: (r) => `${r.days}D / ${r.nights}N` },
    { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
    ...(canSeePricing ? [{ key: 'total', head: 'Total', align: 'right', render: (r) => <span className="cell-strong">{inr(computePricing(r).grandTotal)}</span> }] : []),
    { key: 'actions', head: '', align: 'right', render: (r) => (
      <div className="row gap-xs end">
        <Link to={`/app/packages/${r.id}`}><Button variant="secondary" size="sm">View</Button></Link>
        <ConfirmDelete what={`${r.code} — ${r.destination || r.clientName || 'package'}`} onConfirm={async () => { await removePackage(r.id); toast('Package deleted') }} />
      </div>
    ) },
  ]
  return (
    <div>
      <PageHeader title="Packages" subtitle="Manage unified travel packages with itinerary and quotation."
        counter={`Packages ${packages.length} / 20`}
        actions={<>
          <Link to="/app/packages/templates"><Button variant="secondary">Itinerary Templates</Button></Link>
          <Link to="/app/packages/inclusions"><Button variant="secondary">Inclusions & Exclusions</Button></Link>
          <Link to="/app/packages/new"><Button>+ Create New Package</Button></Link>
        </>} />
      <FilterBar>
        <Field label="Search"><Input placeholder="Search packages…" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
        <Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Draft</option><option>Quoted</option><option>Confirmed</option><option>Cancelled</option><option>Completed</option></Select></Field>
        <Field label="Destination"><Select><option>All Destinations</option></Select></Field>
        <Button variant="secondary" onClick={exportCsv} disabled={!rows.length}>Export CSV</Button>
      </FilterBar>
      <DataTable columns={columns} rows={rows} />
    </div>
  )
}
