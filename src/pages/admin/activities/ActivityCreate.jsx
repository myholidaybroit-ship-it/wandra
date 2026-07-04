import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Textarea } from '../../../components/ui/UI'
import { ImageInput } from '../../../components/ui/ImageInput'

export default function ActivityCreate() {
  const { addActivity, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', category: '', city: '', durationMins: 120, cost: '', sell: '', description: '', image: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Activity name is required')
    addActivity({ ...f, durationMins: Number(f.durationMins) || 0, cost: Number(f.cost) || 0, sell: Number(f.sell) || 0 }); toast('Activity added'); nav('/app/activities')
  }
  return (
    <div className="master-page">
      <PageHeader title="Add Activity / Ticket" subtitle="An activity, ticket or experience for the builder — with its cost & selling price." />
      <Card>
        <div className="form-grid">
          <Field label="Activity / ticket name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Gulmarg Gondola — Phase 1 & 2" /></Field>
          <Field label="Category"><Input value={f.category} onChange={set('category')} placeholder="e.g. Cable Car, Entry Ticket, Meal" /></Field>
          <Field label="City"><Input value={f.city} onChange={set('city')} placeholder="e.g. Gulmarg" /></Field>
          <Field label="Duration (mins)"><Input value={f.durationMins} onChange={set('durationMins')} placeholder="120" /></Field>
          <Field label="Cost (₹)" hint="Your buying price"><Input value={f.cost} onChange={set('cost')} placeholder="2400" /></Field>
          <Field label="Selling (₹)" hint="Given / customer price"><Input value={f.sell} onChange={set('sell')} placeholder="3000" /></Field>
          <div className="field-full"><ImageInput label="Activity photo" hint="Shown on quote PDF day pages" value={f.image} onChange={(v) => setF({ ...f, image: v })} /></div>
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
