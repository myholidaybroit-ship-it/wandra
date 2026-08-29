import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Button, Field, Input, Textarea, DataTable, Modal, ListSearch, PillSelect, ConfirmDelete, DestGroup, groupByDestination } from '../../../components/ui/UI'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'
import { downloadCsv } from '../../../utils/csv'

/* Cities sit under destinations exactly the way destinations sit under the
   agency: hotels, transport routes and activities are all scoped to one, so
   every picker in the builder can be filtered city-wise. */
export default function CityList() {
  const { cities, destinations, hotels, activities, serviceLocations, updateCity, removeCity, toast } = useApp()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)

  const rows = cities.filter((c) => (c.name + (c.destination || '') + (c.state || '')).toLowerCase().includes(q.toLowerCase()))
  const groups = groupByDestination(rows, destinations)
  const usage = (name) => ({
    hotels: hotels.filter((h) => h.city === name).length,
    transport: serviceLocations.filter((s) => s.city === name).length,
    activities: activities.filter((a) => a.city === name).length,
  })

  const exportCsv = () => downloadCsv('cities',
    ['City', 'Destination', 'State', 'Hotels', 'Transport', 'Activities'],
    rows.map((c) => { const u = usage(c.name); return [c.name, c.destination || '', c.state || '', u.hotels, u.transport, u.activities] }))

  const save = async () => {
    if (!edit.name?.trim()) return toast('City name is required')
    await updateCity(edit.id, edit)
    toast('City updated'); setEdit(null)
  }

  const columns = [
    { key: 'name', head: 'City', render: (r) => (
      <div className="row gap-sm">
        <span className="master-thumb" style={r.image ? { backgroundImage: `url("${r.image}")` } : undefined} />
        <div><span className="cell-strong">{r.name}</span><div className="cell-sub">{r.state || r.destination || '—'}</div></div>
      </div>
    ) },
    { key: 'use', head: 'Used by', render: (r) => {
      const u = usage(r.name)
      return <span className="cell-sub">{u.hotels} hotels · {u.transport} transport · {u.activities} activities</span>
    } },
    { key: 'actions', head: '', align: 'right', render: (r) => (
      <div className="row gap-xs end">
        <Button variant="secondary" size="sm" onClick={() => setEdit({ ...r })}>Edit</Button>
        <ConfirmDelete what={r.name} onConfirm={async () => { await removeCity(r.id); toast('City deleted') }} />
      </div>
    ) },
  ]

  return (
    <div>
      <PageHeader title="Cities" subtitle="The cities inside each destination — they scope hotels, transport and activities in the builder."
        actions={<><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><Link to="/app/cities/new"><Button>+ Add City</Button></Link></>} />
      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search cities…" count={rows.length} />
      </div>
      {groups.map((g) => (
        <DestGroup key={g.key} name={g.name} location={g.location} image={g.image} count={g.records.length}
          actions={<Link to={`/app/cities/new${g.key !== '__none__' ? `?destination=${encodeURIComponent(g.name)}` : ''}`}><Button variant="secondary" size="sm">+ Add here</Button></Link>}>
          <DataTable columns={columns} rows={g.records} />
        </DestGroup>
      ))}
      {groups.length === 0 && <DataTable columns={columns} rows={[]} empty="No cities yet — add one so hotels & activities can be filtered city-wise." />}

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit City" width={560}
        footer={<><Button variant="tertiary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && (
          <div className="form-grid">
            <Field label="City name" required><Input value={edit.name || ''} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Destination">
              <PillSelect value={edit.destination || 'Select destination'} options={['Select destination', ...destinations.map((d) => d.name)]}
                onChange={(v) => setEdit({ ...edit, destination: v === 'Select destination' ? '' : v })} />
            </Field>
            <Field label="State / region"><Input value={edit.state || ''} onChange={(e) => setEdit({ ...edit, state: e.target.value })} /></Field>
            <div className="field-full"><ImageInput label="City photo" hint="Used on quote PDFs when a hotel or activity has none" value={edit.image || ''} onChange={(v) => setEdit({ ...edit, image: v })} folder="cities" /></div>
            <div className="field-full"><GalleryInput label="More city photos" value={edit.gallery || []} onChange={(v) => setEdit({ ...edit, gallery: v })} folder="cities" /></div>
            <Field label="Description" full><Textarea rows={3} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
