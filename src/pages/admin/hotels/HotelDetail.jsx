import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Select, Textarea } from '../../../components/ui/UI'

export default function HotelDetail() {
  const { id } = useParams()
  const { hotels, packages, updateHotel, toast } = useApp()
  const h = hotels.find((x) => x.id === id)
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState(h || {})
  if (!h) return <div>Hotel not found. <Link className="c-link" to="/app/hotels">Back</Link></div>
  const usedIn = packages.filter((p) => p.hotelsAlloc?.some((a) => a.hotelId === h.id || a.name === h.name))
  const save = () => { updateHotel(h.id, { ...f, rating: Number(f.rating), buyingPrice: Number(f.buyingPrice) }); toast('Hotel updated'); setEdit(false) }

  return (
    <div>
      <PageHeader title={h.name} subtitle={`${h.city} · ${'★'.repeat(h.rating)}`}
        actions={<><Link to="/app/hotels"><Button variant="secondary" size="sm">← Back</Button></Link><Button size="sm" onClick={() => { setF(h); setEdit(true) }}>✎ Edit</Button></>} />
      <div className="detail-grid">
        <Card>
          <span className="t-title-md">Hotel Information</span>
          <hr className="divider" />
          <div className="kv-grid">
            <KV k="City" v={h.city} /><KV k="Rating" v={`${h.rating} / 5`} />
            <KV k="Phone" v={h.phone} /><KV k="Email" v={h.email} />
            <KV k="Address" v={h.address || '—'} /><KV k="Room Types" v={h.roomTypes} />
          </div>
          <hr className="divider" />
          <p className="t-body-sm c-body">{h.description}</p>
        </Card>
        <Card className="fin-card">
          <span className="t-title-md">Pricing & Usage</span>
          <hr className="divider" />
          <div className="fin-line"><span className="c-body">Default Buying Price</span><span className="cell-strong">{inr(h.buyingPrice)}/night</span></div>
          <div className="fin-line"><span className="c-body">Used in packages</span><span className="cell-strong">{usedIn.length}</span></div>
          <hr className="divider" />
          {usedIn.map((p) => <Link key={p.id} to={`/app/packages/${p.id}`} className="fin-line c-link mono">{p.code}</Link>)}
        </Card>
      </div>
      <Modal open={edit} onClose={() => setEdit(false)} title="Edit Hotel" width={560}
        footer={<><Button variant="secondary" onClick={() => setEdit(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="form-grid">
          <Field label="Name"><Input value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="City"><Input value={f.city || ''} onChange={(e) => setF({ ...f, city: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone || ''} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Rating"><Select value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}</Select></Field>
          <Field label="Buying Price"><Input value={f.buyingPrice || ''} onChange={(e) => setF({ ...f, buyingPrice: e.target.value })} /></Field>
          <Field label="Room Types" full><Input value={f.roomTypes || ''} onChange={(e) => setF({ ...f, roomTypes: e.target.value })} /></Field>
          <Field label="Description" full><Textarea value={f.description || ''} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}
function KV({ k, v }) { return <div className="kv"><span className="kv-k">{k}</span><span className="kv-v">{v}</span></div> }
