import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, PillSelect } from '../../../components/ui/UI'
import { ImageInput } from '../../../components/ui/ImageInput'

export default function CabDetail() {
  const { id } = useParams()
  const { cabs, packages, updateCab, toast } = useApp()
  const c = cabs.find((x) => x.id === id)
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState(c || {})
  if (!c) return <div>Cab not found. <Link className="c-link" to="/app/cabs">Back</Link></div>
  const usedIn = packages.filter((p) => p.cabs?.some((a) => a.cabId === c.id || a.name === c.name))
  const save = () => { updateCab(c.id, { ...f, capacity: Number(f.capacity), ratePerKm: Number(f.ratePerKm) || 0, ratePerDay: Number(f.ratePerDay) || 0 }); toast('Cab updated'); setEdit(false) }
  return (
    <div>
      <PageHeader title={c.name} subtitle={`${c.type} · ${c.capacity} pax`}
        actions={<><Link to="/app/cabs"><Button variant="secondary" size="sm">← Back</Button></Link><Button size="sm" onClick={() => { setF(c); setEdit(true) }}>✎ Edit</Button></>} />
      <div className="detail-grid">
        <Card>
          <span className="t-title-md">Vehicle Information</span>
          <hr className="divider" />
          {c.image && <img src={c.image} alt={c.name} style={{ width: '100%', height: 170, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 14 }} />}
          <div className="kv-grid">
            <KV k="Type" v={c.type} /><KV k="AC" v={c.acType} />
            <KV k="Capacity" v={`${c.capacity} pax`} /><KV k="Rate / KM" v={inr(c.ratePerKm)} />
            <KV k="Rate / Day" v={inr(c.ratePerDay || 0)} /><KV k="Status" v={c.status} />
            <KV k="Contact" v={c.contact} />
          </div>
        </Card>
        <Card className="fin-card">
          <span className="t-title-md">Used In</span>
          <hr className="divider" />
          {usedIn.length === 0 && <div className="t-body-sm c-muted">Not used in any package yet.</div>}
          {usedIn.map((p) => <Link key={p.id} to={`/app/packages/${p.id}`} className="fin-line c-link mono">{p.code}</Link>)}
        </Card>
      </div>
      <Modal open={edit} onClose={() => setEdit(false)} title="Edit Cab" width={560}
        footer={<><Button variant="secondary" onClick={() => setEdit(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="form-grid">
          <Field label="Name"><Input value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Type"><PillSelect value={f.type} options={['Sedan', 'SUV', 'Tempo Traveller', 'Universal']} onChange={(v) => setF({ ...f, type: v })} /></Field>
          <Field label="AC"><PillSelect value={f.acType} options={['AC', 'Non-AC']} onChange={(v) => setF({ ...f, acType: v })} /></Field>
          <Field label="Capacity"><Input value={f.capacity || ''} onChange={(e) => setF({ ...f, capacity: e.target.value })} /></Field>
          <Field label="Rate / KM"><Input value={f.ratePerKm || ''} onChange={(e) => setF({ ...f, ratePerKm: e.target.value })} /></Field>
          <Field label="Rate / Day" hint="Auto-fills the quote builder"><Input value={f.ratePerDay || ''} onChange={(e) => setF({ ...f, ratePerDay: e.target.value })} /></Field>
          <div className="field-full"><ImageInput label="Vehicle photo" value={f.image || ''} onChange={(v) => setF({ ...f, image: v })} /></div>
          <Field label="Contact"><Input value={f.contact || ''} onChange={(e) => setF({ ...f, contact: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}
function KV({ k, v }) { return <div className="kv"><span className="kv-k">{k}</span><span className="kv-v">{v}</span></div> }
