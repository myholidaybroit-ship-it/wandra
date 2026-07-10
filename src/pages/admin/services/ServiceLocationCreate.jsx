import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, PillSelect, Textarea } from '../../../components/ui/UI'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'

const SERVICE_TYPES = ['Arrival Transfer', 'Departure Transfer', 'Intercity Transfer', 'Sightseeing', 'Excursion', 'Half-day Transfer', 'Full-day Transfer']
const optionalNumber = (v) => String(v ?? '').trim() === '' ? null : Number(v) || 0

export default function ServiceLocationCreate() {
  const { addServiceLocation, destinations, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', destination: '', serviceType: 'Arrival Transfer', durationMins: '', city: '', cost: '', sell: '', description: '', image: '', gallery: [] })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Transport name is required')
    addServiceLocation({ ...f, durationMins: optionalNumber(f.durationMins), cost: Number(f.cost) || 0, sell: Number(f.sell) || 0 })
    toast('Transport added'); nav('/app/services')
  }
  return (
    <div className="master-page">
      <PageHeader title="Add Transport" subtitle="A transport route the builder can pick — rates auto-fill the quote." />
      <Card>
        <div className="form-grid">
          <Field label="Transport / route" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Airport to Hotel" /></Field>
          <Field label="Destination" hint="Scopes this route to a destination so it only shows up when building quotes for that place">
            <PillSelect value={f.destination || 'Select destination'} options={['Select destination', ...destinations.map((d) => d.name)]}
              onChange={(v) => setF({ ...f, destination: v === 'Select destination' ? '' : v })} />
          </Field>
          <Field label="Service type"><PillSelect value={f.serviceType} options={SERVICE_TYPES} onChange={(v) => setF({ ...f, serviceType: v })} /></Field>
          <Field label="Duration (mins)"><Input value={f.durationMins} onChange={set('durationMins')} placeholder="Optional" /></Field>
          <Field label="City"><Input value={f.city} onChange={set('city')} placeholder="e.g. Srinagar" /></Field>
          <Field label="Cost (₹)" hint="Your buying price per day / trip"><Input value={f.cost} onChange={set('cost')} placeholder="1200" /></Field>
          <Field label="Selling (₹)" hint="Given / customer price"><Input value={f.sell} onChange={set('sell')} placeholder="1600" /></Field>
          <div className="field-full"><ImageInput label="Main service photo" hint="The hero photo on quote PDF day pages" value={f.image} onChange={(v) => setF({ ...f, image: v })} folder="services" /></div>
          <div className="field-full"><GalleryInput label="More service photos" hint="Extra photos for a richer PDF" value={f.gallery} onChange={(v) => setF({ ...f, gallery: v })} folder="services" /></div>
          <Field label="Description" full hint="Free notes about this route — auto-fills the transfer on the quote & itinerary">
            <Textarea rows={3} value={f.description} onChange={set('description')} placeholder="e.g. Private cab with meet & greet at arrivals, bottled water on board, English-speaking driver." />
          </Field>
        </div>
        <div className="row gap-sm mt-lg">
          <Button onClick={save}>⤓ Save Location</Button>
          <Button variant="secondary" onClick={() => nav('/app/services')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
