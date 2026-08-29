import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Textarea, PillSelect, CityPicker } from '../../../components/ui/UI'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'
import SeasonRates, { cleanSeasonRates, HOTEL_SEASON_FIELDS } from '../../../components/ui/SeasonRates'

export default function HotelCreate() {
  const { addHotel, destinations, cities, toast } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [f, setF] = useState({ name: '', destination: params.get('destination') || '', address: '', city: '', phone: '', email: '', rating: 5, buyingPrice: '', extraBedAdult: '', extraBedChild: '', childNoBed: '', infantCharge: '', roomTypes: '', description: '', image: '', gallery: [], rates: [] })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Hotel name is required')
    addHotel({
      ...f,
      rating: Number(f.rating),
      buyingPrice: Number(f.buyingPrice) || 0,
      extraBedAdult: Number(f.extraBedAdult) || 0,
      extraBedChild: Number(f.extraBedChild) || 0,
      childNoBed: Number(f.childNoBed) || 0,
      infantCharge: Number(f.infantCharge) || 0,
      rates: cleanSeasonRates(f.rates, HOTEL_SEASON_FIELDS),
    })
    toast('Hotel added'); nav('/app/hotels')
  }
  return (
    <div className="master-page">
      <PageHeader title="Add New Hotel" subtitle="Add an affiliated hotel with its base buying price and any season-wise rates." />
      <Card>
        <div className="form-grid">
          <Field label="Hotel Name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. The Lalit Grand Palace" /></Field>
          <Field label="Destination" hint="Scopes this hotel to a destination so it only shows up when building quotes for that place">
            <PillSelect value={f.destination || 'Select destination'} options={['Select destination', ...destinations.map((d) => d.name)]}
              onChange={(v) => setF({ ...f, destination: v === 'Select destination' ? '' : v, city: '' })} />
          </Field>
          <Field label="City" hint="Narrows the builder's hotel picker city-wise — manage the list under Master Data → Cities">
            <CityPicker value={f.city} cities={cities} destination={f.destination} onChange={(v) => setF({ ...f, city: v })} />
          </Field>
          <Field label="Address" full><Input value={f.address} onChange={set('address')} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><Input value={f.email} onChange={set('email')} /></Field>
          <Field label="Rating"><PillSelect value={`${f.rating} Star`} options={['5 Star', '4 Star', '3 Star', '2 Star', '1 Star']} onChange={(v) => setF({ ...f, rating: Number(v[0]) })} /></Field>
          <Field label="Default Buying Price (₹ / night)" required hint="Your actual cost — without margin. Used whenever no season below covers the travel date.">
            <Input value={f.buyingPrice} onChange={set('buyingPrice')} placeholder="18000" />
          </Field>
          <Field label="Extra Bed — Adult (₹ / night)" hint="AWEB rate — cost per adult on an extra bed"><Input value={f.extraBedAdult} onChange={set('extraBedAdult')} placeholder="7000" /></Field>
          <Field label="Extra Bed — Child (₹ / night)" hint="CWEB rate — child with an extra bed"><Input value={f.extraBedChild} onChange={set('extraBedChild')} placeholder="4500" /></Field>
          <Field label="Child No Bed (₹ / night)" hint="CNB rate — child sharing, no extra bed"><Input value={f.childNoBed} onChange={set('childNoBed')} placeholder="2500" /></Field>
          <Field label="Infant (₹ / night)" hint="Usually 0 — infants under 2 normally stay free"><Input value={f.infantCharge} onChange={set('infantCharge')} placeholder="0" /></Field>
          <Field label="Room Types" full><Input value={f.roomTypes} onChange={set('roomTypes')} placeholder="Deluxe, Palace Room, Suite" /></Field>
          <div className="field-full">
            <SeasonRates value={f.rates} onChange={(rates) => setF({ ...f, rates })} fields={HOTEL_SEASON_FIELDS} base={f}
              hint="Different room rates for different travel dates — e.g. Aug–Nov at one rate, Dec–Jan at another. The quote picks the season that covers the trip's start date." />
          </div>
          <div className="field-full"><ImageInput label="Main hotel photo" hint="The hero photo on quote PDFs and hotel cards" value={f.image} onChange={(v) => setF({ ...f, image: v })} folder="hotels" /></div>
          <div className="field-full"><GalleryInput label="More hotel photos" hint="Rooms, pool, lobby… shown as a photo collage on the PDF" value={f.gallery} onChange={(v) => setF({ ...f, gallery: v })} folder="hotels" /></div>
          <Field label="Description" full><Textarea value={f.description} onChange={set('description')} placeholder="Hotel description, amenities…" /></Field>
        </div>
        <div className="row gap-sm mt-lg">
          <Button onClick={save}>⤓ Save Hotel</Button>
          <Button variant="secondary" onClick={() => nav('/app/hotels')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
