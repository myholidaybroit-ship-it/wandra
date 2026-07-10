import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, Field, Input, DataTable, Badge, Modal, Textarea, ListSearch, PillSelect } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import { downloadCsv } from '../../../utils/csv'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'

const optionalMins = (v) => Number(v) > 0 ? `${Number(v)} mins` : '—'
const optionalNumber = (v) => String(v ?? '').trim() === '' ? null : Number(v) || 0

export default function ActivityList() {
  const { activities, destinations, updateActivity, toast } = useApp()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const rows = activities.filter((a) => (a.name + a.category + (a.city || '') + (a.destination || '')).toLowerCase().includes(q.toLowerCase()))

  const exportCsv = () => downloadCsv('activities',
    ['Activity', 'Destination', 'Category', 'City', 'Duration (mins)', 'Cost', 'Selling', 'Description'],
    rows.map((a) => [a.name, a.destination || '', a.category, a.city || '', Number(a.durationMins) > 0 ? a.durationMins : '', a.cost, a.sell, a.description || '']))

  const save = () => {
    updateActivity(edit.id, { ...edit, durationMins: optionalNumber(edit.durationMins), cost: Number(edit.cost) || 0, sell: Number(edit.sell) || 0 })
    toast('Activity updated'); setEdit(null)
  }

  const columns = [
    { key: 'name', head: 'Activity / ticket', render: (r) => (
      <div className="row gap-sm">
        <span className="master-thumb" style={r.image ? { backgroundImage: `url("${r.image}")` } : undefined} />
        <div><span className="cell-strong">{r.name}</span><div className="cell-sub">{r.city || '—'} · {optionalMins(r.durationMins)}</div></div>
      </div>
    ) },
    { key: 'destination', head: 'Destination', render: (r) => <span className="cell-sub">{r.destination || '—'}</span> },
    { key: 'category', head: 'Category', render: (r) => <Badge tone="neutral">{r.category}</Badge> },
    { key: 'cost', head: 'Cost', align: 'right', render: (r) => <span className="cell-sub">{inr(r.cost)}</span> },
    { key: 'sell', head: 'Selling', align: 'right', render: (r) => <span className="cell-strong">{inr(r.sell)}</span> },
    { key: 'actions', head: '', align: 'right', render: (r) => <Button variant="secondary" size="sm" onClick={() => setEdit({ ...r })}>Edit</Button> },
  ]
  return (
    <div>
      <PageHeader title="Activities" subtitle="Experiences with cost & selling price — picked straight into quotes."
        actions={<><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><Link to="/app/activities/new"><Button>+ Add Activity</Button></Link></>} />
      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search by name, category, city…" count={rows.length} />
      </div>
      <DataTable columns={columns} rows={rows} empty="No activities yet." />

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit Activity" width={620}
        footer={<><Button variant="tertiary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && (
          <div className="form-grid">
            <Field label="Name" full><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Destination">
              <PillSelect value={edit.destination || 'Select destination'} options={['Select destination', ...destinations.map((d) => d.name)]}
                onChange={(v) => setEdit({ ...edit, destination: v === 'Select destination' ? '' : v })} />
            </Field>
            <Field label="Category"><Input value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></Field>
            <Field label="City"><Input value={edit.city || ''} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></Field>
            <Field label="Duration (mins)"><Input value={edit.durationMins ?? ''} onChange={(e) => setEdit({ ...edit, durationMins: e.target.value })} placeholder="Optional" /></Field>
            <div className="field-full"><ImageInput label="Main activity photo" value={edit.image || ''} onChange={(v) => setEdit({ ...edit, image: v })} folder="activities" /></div>
            <div className="field-full"><GalleryInput label="More activity photos" hint="Extra photos for a richer PDF" value={edit.gallery || []} onChange={(v) => setEdit({ ...edit, gallery: v })} folder="activities" /></div>
            <Field label="Cost (₹)"><Input value={edit.cost ?? ''} onChange={(e) => setEdit({ ...edit, cost: e.target.value })} /></Field>
            <Field label="Selling (₹)"><Input value={edit.sell ?? ''} onChange={(e) => setEdit({ ...edit, sell: e.target.value })} /></Field>
            <Field label="Description" full><Textarea rows={3} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
