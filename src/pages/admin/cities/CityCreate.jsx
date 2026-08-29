import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Textarea, PillSelect } from '../../../components/ui/UI'
import { ImageInput, GalleryInput } from '../../../components/ui/ImageInput'

export default function CityCreate() {
  const { addCity, destinations, toast } = useApp()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [f, setF] = useState({ name: '', destination: params.get('destination') || '', state: '', description: '', image: '', gallery: [] })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async () => {
    if (!f.name.trim()) return toast('City name is required')
    await addCity(f)
    toast('City added'); nav('/app/cities')
  }
  return (
    <div className="master-page">
      <PageHeader title="Add City" subtitle="A city inside a destination — hotels, transport and activities are filtered by it in the builder." />
      <Card>
        <div className="form-grid">
          <Field label="City name" required><Input value={f.name} onChange={set('name')} placeholder="e.g. Srinagar" /></Field>
          <Field label="Destination" hint="The parent destination this city belongs to">
            <PillSelect value={f.destination || 'Select destination'} options={['Select destination', ...destinations.map((d) => d.name)]}
              onChange={(v) => setF({ ...f, destination: v === 'Select destination' ? '' : v })} />
          </Field>
          <Field label="State / region"><Input value={f.state} onChange={set('state')} placeholder="e.g. Jammu & Kashmir" /></Field>
          <div className="field-full"><ImageInput label="City photo" hint="Used on quote PDFs when a hotel or activity has none" value={f.image} onChange={(v) => setF({ ...f, image: v })} folder="cities" /></div>
          <div className="field-full"><GalleryInput label="More city photos" value={f.gallery} onChange={(v) => setF({ ...f, gallery: v })} folder="cities" /></div>
          <Field label="Description" full><Textarea rows={3} value={f.description} onChange={set('description')} placeholder="What this city is known for — surfaces on the itinerary." /></Field>
        </div>
        <div className="row gap-sm mt-lg">
          <Button onClick={save}>⤓ Save City</Button>
          <Button variant="secondary" onClick={() => nav('/app/cities')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
