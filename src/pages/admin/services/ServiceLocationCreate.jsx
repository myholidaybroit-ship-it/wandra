import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, PillSelect, Textarea, CityPicker } from '../../../components/ui/UI'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'
import SeasonRates, { cleanSeasonRates, SERVICE_SEASON_FIELDS } from '../../../components/ui/SeasonRates'

const SERVICE_TYPES = ['Arrival Transfer', 'Departure Transfer', 'Intercity Transfer', 'Sightseeing', 'Excursion', 'Half-day Transfer', 'Full-day Transfer']
const optionalNumber = (v) => String(v ?? '').trim() === '' ? null : Number(v) || 0

export default function ServiceLocationCreate() {
  const { addServiceLocation, destinations, cities, cabTypes, toast } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [f, setF] = useState({ name: '', destination: params.get('destination') || '', serviceType: 'Arrival Transfer', cabType: '', durationHours: '', city: '', cost: '', sell: '', description: '', image: '', gallery: [], rates: [] })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Transport name is required')
    addServiceLocation({
      ...f,
      durationHours: optionalNumber(f.durationHours),
      cost: Number(f.cost) || 0,
      sell: Number(f.sell) || 0,
      rates: cleanSeasonRates(f.rates, SERVICE_SEASON_FIELDS),
    })
    toast('Transport added'); nav('/app/services')
  }
  return (
    <div className="master-page">
      <PageHeader title="Add Transport" subtitle="A transport route the builder can pick — rates and vehicle type auto-fill the quote." />
      <Card>
        <div className="form-grid">
          <Field label="Transport / route" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Airport to Hotel" /></Field>
          <Field label="Destination" hint="Scopes this route to a destination so it only shows up when building quotes for that place">
            <PillSelect value={f.destination || 'Select destination'} options={['Select destination', ...destinations.map((d) => d.name)]}
              onChange={(v) => setF({ ...f, destination: v === 'Select destination' ? '' : v, city: '' })} />
          </Field>
          <Field label="City" hint="Filters the builder's transport picker city-wise, the same way hotels are filtered">
            <CityPicker value={f.city} cities={cities} destination={f.destination} onChange={(v) => setF({ ...f, city: v })} />
          </Field>
          <Field label="Service type"><PillSelect value={f.serviceType} options={SERVICE_TYPES} onChange={(v) => setF({ ...f, serviceType: v })} /></Field>
          <Field label="Cab type" hint="The vehicle this route is normally quoted with">
            <PillSelect value={f.cabType || 'Any vehicle'} options={['Any vehicle', ...(cabTypes || [])]}
              onChange={(v) => setF({ ...f, cabType: v === 'Any vehicle' ? '' : v })} />
          </Field>
          <Field label="Duration (hours)" hint="e.g. 1.5"><Input value={f.durationHours} onChange={set('durationHours')} placeholder="Optional" /></Field>
          <Field label="Cost (₹)" hint="Your buying price per day / trip"><Input value={f.cost} onChange={set('cost')} placeholder="1200" /></Field>
          <Field label="Selling (₹)" hint="Given / customer price"><Input value={f.sell} onChange={set('sell')} placeholder="1600" /></Field>
          <div className="field-full">
            <SeasonRates value={f.rates} onChange={(rates) => setF({ ...f, rates })} fields={SERVICE_SEASON_FIELDS} base={f}
              hint="Peak-season transfer rates — the quote picks the season covering the trip's start date." />
          </div>
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
