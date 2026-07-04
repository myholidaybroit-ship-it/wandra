import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, FilterBar, Field, Input, DataTable, Badge, Modal, Textarea } from '../../../components/ui/UI'
import { downloadCsv } from '../../../utils/csv'
import { ImageInput } from '../../../components/ui/ImageInput'

export default function ActivityList() {
  const { activities, updateActivity, toast } = useApp()
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const rows = activities.filter((a) => (a.name + a.category + (a.city || '')).toLowerCase().includes(q.toLowerCase()))

  const exportCsv = () => downloadCsv('activities',
    ['Activity', 'Category', 'City', 'Duration (mins)', 'Cost', 'Selling', 'Description'],
    rows.map((a) => [a.name, a.category, a.city || '', a.durationMins, a.cost, a.sell, a.description || '']))

  const save = () => {
    updateActivity(edit.id, { ...edit, durationMins: Number(edit.durationMins) || 0, cost: Number(edit.cost) || 0, sell: Number(edit.sell) || 0 })
    toast('Activity updated'); setEdit(null)
  }

  const columns = [
    { key: 'name', head: 'Activity / ticket', render: (r) => (
      <div className="row gap-sm">
        <span className="master-thumb" style={r.image ? { backgroundImage: `url("${r.image}")` } : undefined} />
        <div><span className="cell-strong">{r.name}</span><div className="cell-sub">{r.city || '—'} · {r.durationMins} mins</div></div>
      </div>
    ) },
    { key: 'category', head: 'Category', render: (r) => <Badge tone="neutral">{r.category}</Badge> },
    { key: 'cost', head: 'Cost', align: 'right', render: (r) => <span className="cell-sub">{inr(r.cost)}</span> },
    { key: 'sell', head: 'Selling', align: 'right', render: (r) => <span className="cell-strong">{inr(r.sell)}</span> },
    { key: 'actions', head: '', align: 'right', render: (r) => <Button variant="secondary" size="sm" onClick={() => setEdit({ ...r })}>Edit</Button> },
  ]
  return (
    <div>
      <PageHeader title="Activities & Tickets" subtitle="Experiences with cost & selling price — picked straight into quotes."
        counter={`Activities ${activities.length}`}
        actions={<><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><Link to="/app/activities/new"><Button>+ Add Activity</Button></Link></>} />
      <FilterBar>
        <Field label="Search"><Input placeholder="Search by name, category, city…" value={q} onChange={(e) => setQ(e.target.value)} /></Field>
      </FilterBar>
      <DataTable columns={columns} rows={rows} empty="No activities yet." />

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit Activity" width={620}
        footer={<><Button variant="tertiary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && (
          <div className="form-grid">
            <Field label="Name" full><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Category"><Input value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></Field>
            <Field label="City"><Input value={edit.city || ''} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></Field>
            <Field label="Duration (mins)"><Input value={edit.durationMins} onChange={(e) => setEdit({ ...edit, durationMins: e.target.value })} /></Field>
            <div className="field-full"><ImageInput label="Activity photo" value={edit.image || ''} onChange={(v) => setEdit({ ...edit, image: v })} /></div>
            <Field label="Cost (₹)"><Input value={edit.cost ?? ''} onChange={(e) => setEdit({ ...edit, cost: e.target.value })} /></Field>
            <Field label="Selling (₹)"><Input value={edit.sell ?? ''} onChange={(e) => setEdit({ ...edit, sell: e.target.value })} /></Field>
            <Field label="Description" full><Textarea rows={3} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
