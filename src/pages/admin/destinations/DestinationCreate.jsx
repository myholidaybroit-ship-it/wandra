import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Textarea, PillSelect } from '../../../components/ui/UI'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'

export default function DestinationCreate() {
  const { addDestination, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', type: 'Domestic', location: '', features: '', description: '', image: '', gallery: [] })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name) return toast('Destination name is required')
    addDestination(f)
    toast('Destination added'); nav('/app/destinations')
  }
  return (
    <div className="master-page">
      <PageHeader title="Add New Destination" subtitle="Create a new travel destination." />
      <Card>
        <div className="form-grid">
          <Field label="Destination Name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Gulmarg" /></Field>
          <Field label="Type" hint="Drives the Domestic / International tabs in New Query">
            <PillSelect value={f.type} options={['Domestic', 'International']} onChange={(v) => setF({ ...f, type: v })} />
          </Field>
          <Field label="Location" full><Input value={f.location} onChange={set('location')} placeholder="e.g. Baramulla, J&K" /></Field>
          <div className="field-full"><ImageInput label="Cover image" hint="Used on quote PDFs, landing covers and detail pages" value={f.image} onChange={(v) => setF({ ...f, image: v })} /></div>
          <div className="field-full"><GalleryInput label="Gallery" hint="Extra photos — used for PDF day-page collages" value={f.gallery} onChange={(v) => setF({ ...f, gallery: v })} /></div>
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
