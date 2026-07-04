import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Textarea, PillSelect } from '../../../components/ui/UI'
import { ImageInput } from '../../../components/ui/ImageInput'

export default function HotelCreate() {
  const { addHotel, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', address: '', city: '', phone: '', email: '', rating: 5, buyingPrice: '', extraBedAdult: '', extraBedChild: '', childNoBed: '', roomTypes: '', description: '', image: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Hotel name is required')
    addHotel({ ...f, rating: Number(f.rating), buyingPrice: Number(f.buyingPrice) || 0, extraBedAdult: Number(f.extraBedAdult) || 0, extraBedChild: Number(f.extraBedChild) || 0, childNoBed: Number(f.childNoBed) || 0 }); toast('Hotel added'); nav('/app/hotels')
  }
  return (
    <div className="master-page">
      <PageHeader title="Add New Hotel" subtitle="Add an affiliated hotel with its base buying price." />
      <Card>
        <div className="form-grid">
          <Field label="Hotel Name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. The Lalit Grand Palace" /></Field>
          <Field label="City"><Input value={f.city} onChange={set('city')} /></Field>
          <Field label="Address" full><Input value={f.address} onChange={set('address')} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><Input value={f.email} onChange={set('email')} /></Field>
          <Field label="Rating"><PillSelect value={`${f.rating} Star`} options={['5 Star', '4 Star', '3 Star', '2 Star', '1 Star']} onChange={(v) => setF({ ...f, rating: Number(v[0]) })} /></Field>
          <Field label="Default Buying Price (₹ / night)" required hint="Your actual cost — without margin. Used to calculate profit in Reports.">
            <Input value={f.buyingPrice} onChange={set('buyingPrice')} placeholder="18000" />
          </Field>
          <Field label="Extra Bed — Adult (₹ / night)" hint="AWEB rate — cost per adult on an extra bed"><Input value={f.extraBedAdult} onChange={set('extraBedAdult')} placeholder="7000" /></Field>
          <Field label="Extra Bed — Child (₹ / night)" hint="CWEB rate — child with an extra bed"><Input value={f.extraBedChild} onChange={set('extraBedChild')} placeholder="4500" /></Field>
          <Field label="Child No Bed (₹ / night)" hint="CNB rate — child sharing, no extra bed"><Input value={f.childNoBed} onChange={set('childNoBed')} placeholder="2500" /></Field>
          <Field label="Room Types" full><Input value={f.roomTypes} onChange={set('roomTypes')} placeholder="Deluxe, Palace Room, Suite" /></Field>
          <div className="field-full"><ImageInput label="Hotel photo" hint="Shown on quote PDFs and hotel cards" value={f.image} onChange={(v) => setF({ ...f, image: v })} /></div>
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
