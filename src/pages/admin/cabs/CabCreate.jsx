import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Select, PlanBanner } from '../../../components/ui/UI'

export default function CabCreate() {
  const { addCab, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', type: 'Sedan', acType: 'AC', capacity: 4, ratePerKm: '', contact: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Cab name is required')
    addCab({ ...f, capacity: Number(f.capacity), ratePerKm: Number(f.ratePerKm) || 0 }); toast('Cab added'); nav('/app/cabs')
  }
  return (
    <div>
      <PageHeader title="Add New Cab" subtitle="Add a vehicle with its per-km rate." />
      <PlanBanner />
      <Card>
        <div className="form-grid">
          <Field label="Cab Name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Swift Dzire" /></Field>
          <Field label="Type"><Select value={f.type} onChange={set('type')}><option>Sedan</option><option>SUV</option><option>Tempo Traveller</option><option>Universal</option></Select></Field>
          <Field label="AC Type"><Select value={f.acType} onChange={set('acType')}><option>AC</option><option>Non-AC</option></Select></Field>
          <Field label="Capacity (pax)"><Input value={f.capacity} onChange={set('capacity')} /></Field>
          <Field label="Rate per KM (₹)" required><Input value={f.ratePerKm} onChange={set('ratePerKm')} placeholder="20" /></Field>
          <Field label="Contact"><Input value={f.contact} onChange={set('contact')} placeholder="Driver / vendor phone" /></Field>
        </div>
        <div className="row gap-sm mt-lg">
          <Button onClick={save}>⤓ Save Cab</Button>
          <Button variant="secondary" onClick={() => nav('/app/cabs')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
