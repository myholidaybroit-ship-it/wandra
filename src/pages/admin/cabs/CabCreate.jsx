import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, PillSelect, CityPicker } from '../../../components/ui/UI'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'

export default function CabCreate() {
  const { addCab, cabTypes, cities, destinations, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', type: 'Sedan', acType: 'AC', capacity: 4, destination: '', city: '', ratePerKm: '', ratePerDay: '', contact: '', image: '', gallery: [] })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Cab name is required')
    addCab({ ...f, capacity: Number(f.capacity) || 0, ratePerKm: Number(f.ratePerKm) || 0, ratePerDay: Number(f.ratePerDay) || 0 })
    toast('Cab added'); nav('/app/cabs')
  }
  return (
    <div className="master-page">
      <PageHeader title="Add New Cab Type" subtitle="Vehicle with a flat per-day rent — the builder auto-fills from here. Nothing is calculated per kilometre." />
      <Card>
        <div className="form-grid">
          <Field label="Cab type name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Swift Dzire" /></Field>
          <Field label="Type" hint="Vehicle category the builder filters by"><PillSelect value={f.type} options={cabTypes?.length ? cabTypes : ['Sedan', 'SUV', 'Tempo Traveller', 'Universal']} onChange={(v) => setF({ ...f, type: v })} /></Field>
          <Field label="AC"><PillSelect value={f.acType} options={['AC', 'Non-AC']} onChange={(v) => setF({ ...f, acType: v })} /></Field>
          <Field label="Capacity (pax)"><Input type="number" min="1" value={f.capacity} onChange={set('capacity')} /></Field>
          <Field label="Destination" hint="Optional — leave blank if this vehicle runs everywhere">
            <PillSelect value={f.destination || 'Any destination'} options={['Any destination', ...destinations.map((d) => d.name)]}
              onChange={(v) => setF({ ...f, destination: v === 'Any destination' ? '' : v, city: '' })} />
          </Field>
          <Field label="City" hint="Optional — filters the builder's cab picker city-wise">
            <CityPicker value={f.city} cities={cities} destination={f.destination} onChange={(v) => setF({ ...f, city: v })} allLabel="Any city" />
          </Field>
          <Field label="Rent / day (₹)" hint="the flat price for this vehicle — auto-fills transport pricing in the builder"><Input value={f.ratePerDay} onChange={set('ratePerDay')} placeholder="3800" /></Field>
          <Field label="Rate per KM (₹)" hint="optional — for your own reference only, never used in a calculation"><Input value={f.ratePerKm} onChange={set('ratePerKm')} placeholder="Optional" /></Field>
          <Field label="Contact"><Input value={f.contact} onChange={set('contact')} placeholder="Driver / vendor phone" /></Field>
          <div className="field-full"><ImageInput label="Main vehicle photo" hint="Shown on lists & the quote builder" value={f.image} onChange={(v) => setF({ ...f, image: v })} folder="cabs" /></div>
          <div className="field-full"><GalleryInput label="More vehicle photos" hint="Interior, luggage space… for a richer PDF" value={f.gallery} onChange={(v) => setF({ ...f, gallery: v })} folder="cabs" /></div>
        </div>
        <div className="row gap-sm mt-lg">
          <Button onClick={save}>⤓ Save Cab Type</Button>
          <Button variant="secondary" onClick={() => nav('/app/cabs')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
