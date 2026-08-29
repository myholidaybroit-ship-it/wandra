import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Textarea, PillSelect, CityPicker } from '../../../components/ui/UI'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'
import SeasonRates, { cleanSeasonRates, ACTIVITY_SEASON_FIELDS } from '../../../components/ui/SeasonRates'

const optionalNumber = (v) => String(v ?? '').trim() === '' ? null : Number(v) || 0

export default function ActivityCreate() {
  const { addActivity, destinations, cities, toast } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [f, setF] = useState({ name: '', destination: params.get('destination') || '', category: '', city: '', durationHours: '', cost: '', sell: '', costChild: '', sellChild: '', infantCharge: '', description: '', image: '', gallery: [], rates: [] })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Activity name is required')
    addActivity({
      ...f,
      durationHours: optionalNumber(f.durationHours),
      cost: Number(f.cost) || 0,
      sell: Number(f.sell) || 0,
      costChild: Number(f.costChild) || 0,
      sellChild: Number(f.sellChild) || 0,
      infantCharge: Number(f.infantCharge) || 0,
      rates: cleanSeasonRates(f.rates, ACTIVITY_SEASON_FIELDS),
    })
    toast('Activity added'); nav('/app/activities')
  }
  return (
    <div className="master-page">
      <PageHeader title="Add Activity / Ticket" subtitle="An activity, ticket or sightseeing experience — with adult & child pricing and any season-wise rates." />
      <Card>
        <div className="form-grid">
          <Field label="Activity / ticket name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Gulmarg Gondola — Phase 1 & 2" /></Field>
          <Field label="Destination" hint="Scopes this activity to a destination so it only shows up when building quotes for that place">
            <PillSelect value={f.destination || 'Select destination'} options={['Select destination', ...destinations.map((d) => d.name)]}
              onChange={(v) => setF({ ...f, destination: v === 'Select destination' ? '' : v, city: '' })} />
          </Field>
          <Field label="Category"><Input value={f.category} onChange={set('category')} placeholder="e.g. Cable Car, Entry Ticket, Meal" /></Field>
          <Field label="City" hint="Filters the builder's activity picker city-wise, the same way hotels are filtered">
            <CityPicker value={f.city} cities={cities} destination={f.destination} onChange={(v) => setF({ ...f, city: v })} />
          </Field>
          <Field label="Duration (hours)" hint="e.g. 2 or 3.5"><Input value={f.durationHours} onChange={set('durationHours')} placeholder="Optional" /></Field>
          <Field label="Adult cost (₹)" hint="Your buying price per adult"><Input value={f.cost} onChange={set('cost')} placeholder="2400" /></Field>
          <Field label="Adult selling (₹)" hint="Given / customer price per adult"><Input value={f.sell} onChange={set('sell')} placeholder="3000" /></Field>
          <Field label="Child cost (₹)" hint="Buying price per child — leave 0 if the same as an adult"><Input value={f.costChild} onChange={set('costChild')} placeholder="1600" /></Field>
          <Field label="Child selling (₹)" hint="Customer price per child"><Input value={f.sellChild} onChange={set('sellChild')} placeholder="2000" /></Field>
          <Field label="Infant (₹)" hint="Usually 0 — infants normally go free"><Input value={f.infantCharge} onChange={set('infantCharge')} placeholder="0" /></Field>
          <div className="field-full">
            <SeasonRates value={f.rates} onChange={(rates) => setF({ ...f, rates })} fields={ACTIVITY_SEASON_FIELDS} base={f}
              hint="Different ticket prices for different travel dates — the quote picks the season covering the trip's start date." />
          </div>
          <div className="field-full"><ImageInput label="Main activity photo" hint="The hero photo on quote PDF day pages" value={f.image} onChange={(v) => setF({ ...f, image: v })} folder="activities" /></div>
          <div className="field-full"><GalleryInput label="More activity photos" hint="Extra photos for a richer PDF" value={f.gallery} onChange={(v) => setF({ ...f, gallery: v })} folder="activities" /></div>
          <Field label="Description" full><Textarea rows={3} value={f.description} onChange={set('description')} placeholder="What the guest will do / see — shown on the quote & WhatsApp itinerary." /></Field>
        </div>
        <div className="row gap-sm mt-lg">
          <Button onClick={save}>⤓ Save Activity</Button>
          <Button variant="secondary" onClick={() => nav('/app/activities')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
