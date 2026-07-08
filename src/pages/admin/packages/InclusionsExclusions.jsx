import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Button, DataTable, Badge, ListSearch, Modal, Field, PillSelect } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './inclusions.css'

/* Listing of destinations — each keeps its OWN inclusion / exclusion list.
   CRUD from here: + Add (create), Manage (edit), trash (clear that list). */
export default function InclusionsExclusions() {
  const { inclusionPresets, destinations, clearDestinationPresets, toast } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()

  const rows = destinations
    .filter((d) => (d.name + ' ' + (d.location || '')).toLowerCase().includes(term))
    .map((d) => {
      const ie = inclusionPresets.byDest?.[d.name] || { inclusions: [], exclusions: [] }
      return { id: d.name, name: d.name, location: d.location, slug: encodeURIComponent(d.name), inc: ie.inclusions.length, exc: ie.exclusions.length, image: d.image }
    })

  const go = (r) => nav(`/app/packages/inclusions/${r.slug}`)

  /* ---- add: pick a destination, then build its lists on its page ---- */
  const [open, setOpen] = useState(false)
  const [dest, setDest] = useState(destinations[0]?.name || '')
  const openAdd = () => { setDest(destinations[0]?.name || ''); setOpen(true) }
  const proceed = () => { if (!dest) return; setOpen(false); nav(`/app/packages/inclusions/${encodeURIComponent(dest)}`) }

  /* ---- delete: clear a destination's whole list ---- */
  const [confirm, setConfirm] = useState(null)
  const doClear = () => { clearDestinationPresets(confirm.name); toast(`Cleared ${confirm.name}`); setConfirm(null) }

  const columns = [
    { key: 'name', head: 'Destination', render: (r) => (
      <div className="row gap-sm">
        <span className="master-thumb" style={r.image ? { backgroundImage: `url("${r.image}")` } : undefined} />
        <div><span className="cell-strong">{r.name}</span><div className="cell-sub">{r.location}</div></div>
      </div>
    ) },
    { key: 'inc', head: 'Inclusions', render: (r) => <span className="ie-count-chip inc">{r.inc}</span> },
    { key: 'exc', head: 'Exclusions', render: (r) => <span className="ie-count-chip exc">{r.exc}</span> },
    { key: 'status', head: '', render: (r) => (r.inc + r.exc === 0 ? <Badge tone="neutral">Not set up</Badge> : null) },
    { key: 'actions', head: '', align: 'right', render: (r) => (
      <div className="ie-row-acts" onClick={(e) => e.stopPropagation()}>
        <Link to={`/app/packages/inclusions/${r.slug}`}><Button variant="secondary" size="sm">{r.inc + r.exc === 0 ? 'Add' : 'Manage'}</Button></Link>
        <button className="ie-row-del" title="Clear this list" disabled={r.inc + r.exc === 0} onClick={() => setConfirm(r)}>
          <Icon name="trash" size={15} />
        </button>
      </div>
    ) },
  ]

  return (
    <div className="ie">
      <div className="ie-head">
        <PageHeader title="Inclusions & Exclusions"
          subtitle="Each destination keeps its own inclusion & exclusion list."
          actions={<Button onClick={openAdd}>+ Add Inclusion / Exclusion</Button>} />
      </div>
      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search destinations…" count={rows.length} />
      </div>
      <DataTable columns={columns} rows={rows} onRowClick={go} empty="No destinations match." />

      {/* add */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add inclusions & exclusions" width={460}
        footer={<><Button variant="tertiary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={proceed} disabled={!dest}>Continue</Button></>}>
        <div className="ie-add-form">
          <Field label="Which destination?" hint="You'll add its inclusions & exclusions on the next screen">
            <PillSelect value={dest || 'Select destination'} options={destinations.map((d) => d.name)} onChange={setDest} />
          </Field>
        </div>
      </Modal>

      {/* delete */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Clear this list" width={440}
        footer={<><Button variant="tertiary" onClick={() => setConfirm(null)}>Cancel</Button><Button variant="danger" onClick={doClear}>Clear list</Button></>}>
        {confirm && (
          <p className="ie-confirm">Remove all <strong>{confirm.inc} inclusion{confirm.inc === 1 ? '' : 's'}</strong> and <strong>{confirm.exc} exclusion{confirm.exc === 1 ? '' : 's'}</strong> from <strong>{confirm.name}</strong>? This can't be undone.</p>
        )}
      </Modal>
    </div>
  )
}
