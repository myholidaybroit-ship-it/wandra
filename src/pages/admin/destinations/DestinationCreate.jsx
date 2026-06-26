import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Textarea, PlanBanner } from '../../../components/ui/UI'

export default function DestinationCreate() {
  const { addDestination, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', location: '', features: '', description: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Destination name is required')
    addDestination(f); toast('Destination added'); nav('/app/destinations')
  }
  return (
    <div>
      <PageHeader title="Add New Destination" subtitle="Create a new travel destination." />
      <PlanBanner />
      <Card>
        <div className="form-grid">
          <Field label="Destination Name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Gulmarg" /></Field>
          <Field label="Location"><Input value={f.location} onChange={set('location')} placeholder="e.g. Baramulla, J&K" /></Field>
          <Field label="Destination Image" full hint="Upload a representative image (max 5MB)">
            <div className="upload-box">Choose File · No file chosen</div>
          </Field>
          <Field label="Features & Specialties" full><Textarea value={f.features} onChange={set('features')} placeholder="Key attractions, special things about this destination" /></Field>
          <Field label="Description" full><Textarea rows={4} value={f.description} onChange={set('description')} placeholder="Detailed destination description" /></Field>
        </div>
        <div className="row gap-sm mt-lg">
          <Button onClick={save}>⤓ Save Destination</Button>
          <Button variant="secondary" onClick={() => nav('/app/destinations')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
