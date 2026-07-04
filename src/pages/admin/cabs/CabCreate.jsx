import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, PillSelect } from '../../../components/ui/UI'
import { ImageInput } from '../../../components/ui/ImageInput'

export default function CabCreate() {
  const { addCab, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', type: 'Sedan', acType: 'AC', capacity: 4, ratePerKm: '', ratePerDay: '', contact: '', image: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Cab name is required')
    addCab({ ...f, capacity: Number(f.capacity), ratePerKm: Number(f.ratePerKm) || 0, ratePerDay: Number(f.ratePerDay) || 0 })
    toast('Cab added'); nav('/app/cabs')
  }
  return (
    <div>
      <PageHeader title="Add New Cab" subtitle="Vehicle with per-km and per-day rates — the builder auto-fills from here." />
      <Card>
        <div className="form-grid">
          <Field label="Cab Name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Swift Dzire" /></Field>
          <Field label="Type"><PillSelect value={f.type} options={['Sedan', 'SUV', 'Tempo Traveller', 'Universal']} onChange={(v) => setF({ ...f, type: v })} /></Field>
          <Field label="AC"><PillSelect value={f.acType} options={['AC', 'Non-AC']} onChange={(v) => setF({ ...f, acType: v })} /></Field>
          <Field label="Capacity (pax)"><Input type="number" min="1" value={f.capacity} onChange={set('capacity')} /></Field>
          <Field label="Rate per KM (₹)"><Input value={f.ratePerKm} onChange={set('ratePerKm')} placeholder="20" /></Field>
          <Field label="Rate per Day (₹)" hint="Auto-fills transport pricing in the quote builder"><Input value={f.ratePerDay} onChange={set('ratePerDay')} placeholder="3800" /></Field>
          <Field label="Contact"><Input value={f.contact} onChange={set('contact')} placeholder="Driver / vendor phone" /></Field>
          <div className="field-full"><ImageInput label="Vehicle photo" hint="Shown on lists & the quote builder" value={f.image} onChange={(v) => setF({ ...f, image: v })} /></div>
        </div>
        <div className="row gap-sm mt-lg">
          <Button onClick={save}>⤓ Save Cab</Button>
          <Button variant="secondary" onClick={() => nav('/app/cabs')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
