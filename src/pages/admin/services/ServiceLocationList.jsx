import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, Field, Input, DataTable, Badge, Modal, PillSelect, ListSearch, Textarea } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import { downloadCsv } from '../../../utils/csv'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'

const SERVICE_TYPES = ['Arrival Transfer', 'Departure Transfer', 'Intercity Transfer', 'Sightseeing', 'Excursion', 'Half-day Transfer', 'Full-day Transfer']
const optionalMins = (v) => Number(v) > 0 ? `${Number(v)} mins` : '—'
const optionalNumber = (v) => String(v ?? '').trim() === '' ? null : Number(v) || 0

export default function ServiceLocationList() {
  const { serviceLocations, destinations, updateServiceLocation, toast } = useApp()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const rows = serviceLocations.filter((s) => (s.name + (s.city || '') + s.serviceType + (s.destination || '')).toLowerCase().includes(q.toLowerCase()))

  const exportCsv = () => downloadCsv('service-locations',
    ['Route', 'Destination', 'Service type', 'Duration (mins)', 'City', 'Cost', 'Selling'],
    rows.map((s) => [s.name, s.destination || '', s.serviceType, Number(s.durationMins) > 0 ? s.durationMins : '', s.city || '', s.cost || 0, s.sell || 0]))

  const save = () => {
    updateServiceLocation(edit.id, { ...edit, durationMins: optionalNumber(edit.durationMins), cost: Number(edit.cost) || 0, sell: Number(edit.sell) || 0 })
    toast('Service location updated'); setEdit(null)
  }

  const columns = [
    { key: 'name', head: 'Service location / route', render: (r) => (
      <div className="row gap-sm">
        <span className="master-thumb" style={r.image ? { backgroundImage: `url("${r.image}")` } : undefined} />
        <span className="cell-strong">{r.name}</span>
      </div>
    ) },
    { key: 'destination', head: 'Destination', render: (r) => <span className="cell-sub">{r.destination || '—'}</span> },
    { key: 'serviceType', head: 'Service type', render: (r) => <Badge tone="info">{r.serviceType}</Badge> },
    { key: 'duration', head: 'Duration', render: (r) => optionalMins(r.durationMins) },
    { key: 'city', head: 'City', render: (r) => <span className="cell-sub">{r.city || '—'}</span> },
    { key: 'cost', head: 'Cost', align: 'right', render: (r) => <span className="cell-sub">{inr(r.cost || 0)}</span> },
    { key: 'sell', head: 'Selling', align: 'right', render: (r) => <span className="cell-strong">{inr(r.sell || 0)}</span> },
    { key: 'actions', head: '', align: 'right', render: (r) => <Button variant="secondary" size="sm" onClick={() => setEdit({ ...r })}>Edit</Button> },
  ]
  return (
    <div>
      <PageHeader title="Service Locations" subtitle="Transport routes — type, duration & rates auto-fill the quote builder."
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
            <Field label="Destination">
              <PillSelect value={edit.destination || 'Select destination'} options={['Select destination', ...destinations.map((d) => d.name)]}
                onChange={(v) => setEdit({ ...edit, destination: v === 'Select destination' ? '' : v })} />
            </Field>
            <Field label="Service type"><PillSelect value={edit.serviceType} options={SERVICE_TYPES} onChange={(v) => setEdit({ ...edit, serviceType: v })} /></Field>
            <Field label="Duration (mins)"><Input value={edit.durationMins ?? ''} onChange={(e) => setEdit({ ...edit, durationMins: e.target.value })} placeholder="Optional" /></Field>
            <Field label="City"><Input value={edit.city || ''} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></Field>
            <Field label="Cost (₹)"><Input value={edit.cost ?? ''} onChange={(e) => setEdit({ ...edit, cost: e.target.value })} /></Field>
            <Field label="Selling (₹)"><Input value={edit.sell ?? ''} onChange={(e) => setEdit({ ...edit, sell: e.target.value })} /></Field>
            <div className="field-full"><ImageInput label="Main service photo" hint="The hero photo on quote PDF day pages" value={edit.image || ''} onChange={(v) => setEdit({ ...edit, image: v })} folder="services" /></div>
            <div className="field-full"><GalleryInput label="More service photos" hint="Extra photos for a richer PDF" value={edit.gallery || []} onChange={(v) => setEdit({ ...edit, gallery: v })} folder="services" /></div>
            <Field label="Description" full hint="Free notes about this route — auto-fills the transfer in the quote builder">
              <Textarea rows={3} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} placeholder="e.g. Private cab with meet & greet, bottled water on board." />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
