import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, Field, Input, DataTable, Badge, Modal, PillSelect, ListSearch } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import { downloadCsv } from '../../../utils/csv'

const SERVICE_TYPES = ['Arrival Transfer', 'Departure Transfer', 'Intercity Transfer', 'Sightseeing', 'Excursion', 'Half-day Transfer', 'Full-day Transfer']

export default function ServiceLocationList() {
  const { serviceLocations, updateServiceLocation, toast } = useApp()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const rows = serviceLocations.filter((s) => (s.name + (s.city || '') + s.serviceType).toLowerCase().includes(q.toLowerCase()))

  const exportCsv = () => downloadCsv('service-locations',
    ['Route', 'Service type', 'Duration (mins)', 'City', 'Cost', 'Selling'],
    rows.map((s) => [s.name, s.serviceType, s.durationMins, s.city || '', s.cost || 0, s.sell || 0]))

  const save = () => {
    updateServiceLocation(edit.id, { ...edit, durationMins: Number(edit.durationMins) || 0, cost: Number(edit.cost) || 0, sell: Number(edit.sell) || 0 })
    toast('Service location updated'); setEdit(null)
  }

  const columns = [
    { key: 'name', head: 'Service location / route', render: (r) => <span className="cell-strong">{r.name}</span> },
    { key: 'serviceType', head: 'Service type', render: (r) => <Badge tone="info">{r.serviceType}</Badge> },
    { key: 'duration', head: 'Duration', render: (r) => `${r.durationMins} mins` },
    { key: 'city', head: 'City', render: (r) => <span className="cell-sub">{r.city || '—'}</span> },
    { key: 'cost', head: 'Cost', align: 'right', render: (r) => <span className="cell-sub">{inr(r.cost || 0)}</span> },
    { key: 'sell', head: 'Selling', align: 'right', render: (r) => <span className="cell-strong">{inr(r.sell || 0)}</span> },
    { key: 'actions', head: '', align: 'right', render: (r) => <Button variant="secondary" size="sm" onClick={() => setEdit({ ...r })}>Edit</Button> },
  ]
  return (
    <div>
      <PageHeader title="Service Locations" subtitle="Transport routes — type, duration & rates auto-fill the quote builder."
        counter={`Locations ${serviceLocations.length}`}
        actions={<><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><Link to="/app/services/new"><Button>+ Add Service Location</Button></Link></>} />
      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search by route, type, city…" count={rows.length} />
      </div>
      <DataTable columns={columns} rows={rows} empty="No service locations yet." />

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit Service Location" width={560}
        footer={<><Button variant="tertiary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && (
          <div className="form-grid">
            <Field label="Route" full><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Service type"><PillSelect value={edit.serviceType} options={SERVICE_TYPES} onChange={(v) => setEdit({ ...edit, serviceType: v })} /></Field>
            <Field label="Duration (mins)"><Input value={edit.durationMins} onChange={(e) => setEdit({ ...edit, durationMins: e.target.value })} /></Field>
            <Field label="City"><Input value={edit.city || ''} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></Field>
            <Field label="Cost (₹)"><Input value={edit.cost ?? ''} onChange={(e) => setEdit({ ...edit, cost: e.target.value })} /></Field>
            <Field label="Selling (₹)"><Input value={edit.sell ?? ''} onChange={(e) => setEdit({ ...edit, sell: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
