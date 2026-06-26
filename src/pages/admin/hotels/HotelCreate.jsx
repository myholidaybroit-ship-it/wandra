import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Textarea, Select, PlanBanner } from '../../../components/ui/UI'

export default function HotelCreate() {
  const { addHotel, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', address: '', city: '', phone: '', email: '', rating: 5, buyingPrice: '', roomTypes: '', description: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Hotel name is required')
    addHotel({ ...f, rating: Number(f.rating), buyingPrice: Number(f.buyingPrice) || 0 }); toast('Hotel added'); nav('/app/hotels')
  }
  return (
    <div>
      <PageHeader title="Add New Hotel" subtitle="Add an affiliated hotel with its base buying price." />
      <PlanBanner />
      <Card>
        <div className="form-grid">
          <Field label="Hotel Name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. The Lalit Grand Palace" /></Field>
          <Field label="City"><Input value={f.city} onChange={set('city')} /></Field>
          <Field label="Address" full><Input value={f.address} onChange={set('address')} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Email"><Input value={f.email} onChange={set('email')} /></Field>
          <Field label="Rating"><Select value={f.rating} onChange={set('rating')}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}</Select></Field>
          <Field label="Default Buying Price (₹ / night)" required hint="Your actual cost — without margin. Used to calculate profit in Reports.">
            <Input value={f.buyingPrice} onChange={set('buyingPrice')} placeholder="18000" />
          </Field>
          <Field label="Room Types" full><Input value={f.roomTypes} onChange={set('roomTypes')} placeholder="Deluxe, Palace Room, Suite" /></Field>
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
