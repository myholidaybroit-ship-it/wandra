import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, Field, Input, DataTable, Badge, Modal, Textarea, ListSearch, PillSelect, CityPicker, ConfirmDelete, DestGroup, groupByDestination } from '../../../components/ui/UI'
import { downloadCsv } from '../../../utils/csv'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'
import SeasonRates, { cleanSeasonRates, ACTIVITY_SEASON_FIELDS } from '../../../components/ui/SeasonRates'
import { hoursOf, fmtHours } from '../../../utils/rates'

const optionalNumber = (v) => String(v ?? '').trim() === '' ? null : Number(v) || 0

export default function ActivityList() {
  const { activities, destinations, cities, updateActivity, removeActivity, toast } = useApp()
  const [q, setQ] = useState('')
  const [city, setCity] = useState('')
  const [edit, setEdit] = useState(null)

  const rows = activities
    .filter((a) => (a.name + a.category + (a.city || '') + (a.destination || '')).toLowerCase().includes(q.toLowerCase()))
    .filter((a) => !city || a.city === city)
  const groups = groupByDestination(rows, destinations)

  const exportCsv = () => downloadCsv('activities',
    ['Activity', 'Destination', 'City', 'Category', 'Duration (hrs)', 'Adult cost', 'Adult selling', 'Child cost', 'Child selling', 'Seasons', 'Description'],
    rows.map((a) => [a.name, a.destination || '', a.city || '', a.category, hoursOf(a) || '', a.cost, a.sell, a.costChild || '', a.sellChild || '', (a.rates || []).length, a.description || '']))

  const save = () => {
    updateActivity(edit.id, {
      ...edit,
      durationHours: optionalNumber(edit.durationHours),
      cost: Number(edit.cost) || 0, sell: Number(edit.sell) || 0,
      costChild: Number(edit.costChild) || 0, sellChild: Number(edit.sellChild) || 0,
      infantCharge: Number(edit.infantCharge) || 0,
      rates: cleanSeasonRates(edit.rates, ACTIVITY_SEASON_FIELDS),
    })
    toast('Activity updated'); setEdit(null)
  }

  const columns = [
    { key: 'name', head: 'Activity / ticket', render: (r) => (
      <div className="row gap-sm">
        <span className="master-thumb" style={r.image ? { backgroundImage: `url("${r.image}")` } : undefined} />
        <div><span className="cell-strong">{r.name}</span><div className="cell-sub">{r.city || '—'}{hoursOf(r) ? ` · ${fmtHours(hoursOf(r))}` : ''}</div></div>
      </div>
    ) },
    { key: 'category', head: 'Category', render: (r) => <Badge tone="neutral">{r.category}</Badge> },
    { key: 'seasons', head: 'Seasons', align: 'right', render: (r) => (
      (r.rates || []).length
        ? <Badge tone="info">{r.rates.length} season{r.rates.length > 1 ? 's' : ''}</Badge>
        : <span className="cell-sub">Flat</span>
    ) },
    { key: 'cost', head: 'Adult', align: 'right', render: (r) => <span className="cell-strong">{inr(r.sell)}<div className="cell-sub">cost {inr(r.cost)}</div></span> },
    { key: 'child', head: 'Child', align: 'right', render: (r) => (
      Number(r.sellChild) || Number(r.costChild)
        ? <span className="cell-strong">{inr(r.sellChild)}<div className="cell-sub">cost {inr(r.costChild)}</div></span>
        : <span className="cell-sub">same as adult</span>
    ) },
    { key: 'actions', head: '', align: 'right', render: (r) => (
      <div className="row gap-xs end">
        <Button variant="secondary" size="sm" onClick={() => setEdit({ ...r })}>Edit</Button>
        <ConfirmDelete what={r.name} onConfirm={async () => { await removeActivity(r.id); toast('Activity deleted') }} />
      </div>
    ) },
  ]
  return (
    <div>
      <PageHeader title="Activities" subtitle="Experiences with adult & child pricing — picked straight into quotes."
        actions={<><Button variant="secondary" onClick={exportCsv}>Export CSV</Button><Link to="/app/activities/new"><Button>+ Add Activity</Button></Link></>} />
      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search by name, category, city…" count={rows.length} />
        <CityPicker value={city} cities={cities} onChange={setCity} allLabel="All cities" />
      </div>
      {groups.map((g) => (
        <DestGroup key={g.key} name={g.name} location={g.location} image={g.image} count={g.records.length}
          actions={<Link to={`/app/activities/new${g.key !== '__none__' ? `?destination=${encodeURIComponent(g.name)}` : ''}`}><Button variant="secondary" size="sm">+ Add here</Button></Link>}>
          <DataTable columns={columns} rows={g.records} />
        </DestGroup>
      ))}
      {groups.length === 0 && <DataTable columns={columns} rows={[]} empty="No activities yet." />}

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit Activity" width={820}
        footer={<><Button variant="tertiary" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        {edit && (
          <div className="form-grid">
            <Field label="Name" full><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Destination">
              <PillSelect value={edit.destination || 'Select destination'} options={['Select destination', ...destinations.map((d) => d.name)]}
                onChange={(v) => setEdit({ ...edit, destination: v === 'Select destination' ? '' : v })} />
            </Field>
            <Field label="Category"><Input value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></Field>
            <Field label="City"><CityPicker value={edit.city || ''} cities={cities} destination={edit.destination} onChange={(v) => setEdit({ ...edit, city: v })} /></Field>
            <Field label="Duration (hours)"><Input value={edit.durationHours ?? (hoursOf(edit) || '')} onChange={(e) => setEdit({ ...edit, durationHours: e.target.value })} placeholder="Optional" /></Field>
            <Field label="Adult cost (₹)"><Input value={edit.cost ?? ''} onChange={(e) => setEdit({ ...edit, cost: e.target.value })} /></Field>
            <Field label="Adult selling (₹)"><Input value={edit.sell ?? ''} onChange={(e) => setEdit({ ...edit, sell: e.target.value })} /></Field>
            <Field label="Child cost (₹)"><Input value={edit.costChild ?? ''} onChange={(e) => setEdit({ ...edit, costChild: e.target.value })} /></Field>
            <Field label="Child selling (₹)"><Input value={edit.sellChild ?? ''} onChange={(e) => setEdit({ ...edit, sellChild: e.target.value })} /></Field>
            <Field label="Infant (₹)" hint="usually 0"><Input value={edit.infantCharge ?? ''} onChange={(e) => setEdit({ ...edit, infantCharge: e.target.value })} /></Field>
            <div className="field-full">
              <SeasonRates value={edit.rates || []} onChange={(rates) => setEdit({ ...edit, rates })} fields={ACTIVITY_SEASON_FIELDS} base={edit} />
            </div>
            <div className="field-full"><ImageInput label="Main activity photo" value={edit.image || ''} onChange={(v) => setEdit({ ...edit, image: v })} folder="activities" /></div>
            <div className="field-full"><GalleryInput label="More activity photos" hint="Extra photos for a richer PDF" value={edit.gallery || []} onChange={(v) => setEdit({ ...edit, gallery: v })} folder="activities" /></div>
            <Field label="Description" full><Textarea rows={3} value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  )
}
