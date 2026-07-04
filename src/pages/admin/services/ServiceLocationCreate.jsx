import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, PillSelect } from '../../../components/ui/UI'

const SERVICE_TYPES = ['Arrival Transfer', 'Departure Transfer', 'Intercity Transfer', 'Sightseeing', 'Excursion', 'Half-day Transfer', 'Full-day Transfer']

export default function ServiceLocationCreate() {
  const { addServiceLocation, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', serviceType: 'Arrival Transfer', durationMins: 60, city: '', cost: '', sell: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Service location name is required')
    addServiceLocation({ ...f, durationMins: Number(f.durationMins) || 0, cost: Number(f.cost) || 0, sell: Number(f.sell) || 0 })
    toast('Service location added'); nav('/app/services')
  }
  return (
    <div>
      <PageHeader title="Add Service Location" subtitle="A transport route the builder can pick — rates auto-fill the quote." />
      <Card>
        <div className="form-grid">
          <Field label="Service location / route" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Airport to Hotel" /></Field>
          <Field label="Service type"><PillSelect value={f.serviceType} options={SERVICE_TYPES} onChange={(v) => setF({ ...f, serviceType: v })} /></Field>
          <Field label="Duration (mins)"><Input value={f.durationMins} onChange={set('durationMins')} placeholder="60" /></Field>
          <Field label="City"><Input value={f.city} onChange={set('city')} placeholder="e.g. Srinagar" /></Field>
          <Field label="Cost (₹)" hint="Your buying price per day / trip"><Input value={f.cost} onChange={set('cost')} placeholder="1200" /></Field>
          <Field label="Selling (₹)" hint="Given / customer price"><Input value={f.sell} onChange={set('sell')} placeholder="1600" /></Field>
        </div>
        <div className="row gap-sm mt-lg">
          <Button onClick={save}>⤓ Save Location</Button>
          <Button variant="secondary" onClick={() => nav('/app/services')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
