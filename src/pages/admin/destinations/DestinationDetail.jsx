import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Modal, Field, Input, Textarea } from '../../../components/ui/UI'

export default function DestinationDetail() {
  const { id } = useParams()
  const { destinations, packages, updateDestination, toast } = useApp()
  const d = destinations.find((x) => x.id === id)
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState(d || {})
  if (!d) return <div>Destination not found. <Link className="c-link" to="/app/destinations">Back</Link></div>
  const usedIn = packages.filter((p) => p.itinerary?.some((day) => day.stops?.some((s) => s.destination === d.name)))
  const save = () => { updateDestination(d.id, f); toast('Destination updated'); setEdit(false) }
  return (
    <div>
      <PageHeader title={d.name} subtitle={d.location}
        actions={<><Link to="/app/destinations"><Button variant="secondary" size="sm">← Back</Button></Link><Button size="sm" onClick={() => { setF(d); setEdit(true) }}>✎ Edit</Button></>} />
      <div className="detail-grid">
        <Card>
          <span className="t-title-md">Destination Details</span>
          <hr className="divider" />
          <div className="ip-hero" style={{ height: 180, borderRadius: 'var(--radius-md)' }} />
          <div className="t-caption c-muted mt-base">Features & Specialties</div>
          <p className="t-body-md mt-xs">{d.features}</p>
          {d.description && <><div className="t-caption c-muted mt-base">Description</div><p className="t-body-sm c-body mt-xs">{d.description}</p></>}
        </Card>
        <Card className="fin-card">
          <span className="t-title-md">Used In</span>
          <hr className="divider" />
          {usedIn.length === 0 && <div className="t-body-sm c-muted">Not used in any package yet.</div>}
          {usedIn.map((p) => <Link key={p.id} to={`/app/packages/${p.id}`} className="fin-line c-link mono">{p.code}</Link>)}
        </Card>
      </div>
      <Modal open={edit} onClose={() => setEdit(false)} title="Edit Destination" width={560}
        footer={<><Button variant="secondary" onClick={() => setEdit(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="form-grid">
          <Field label="Name"><Input value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Location"><Input value={f.location || ''} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
          <Field label="Features" full><Textarea value={f.features || ''} onChange={(e) => setF({ ...f, features: e.target.value })} /></Field>
          <Field label="Description" full><Textarea value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}
