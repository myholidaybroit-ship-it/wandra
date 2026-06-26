import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Select, Textarea, PlanBanner } from '../../../components/ui/UI'

export default function ClientCreate() {
  const { addClient, toast } = useApp()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', phone: '', interest: '', budget: '', address: '', city: '', state: '', country: 'India', status: 'Active', note: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const save = () => {
    if (!f.name) return toast('Client name is required')
    addClient({ ...f, budget: Number(f.budget) || 0 })
    toast('Client saved successfully')
    nav('/app/clients')
  }

  return (
    <div>
      <PageHeader title="Add New Client" subtitle="Register a new client or lead in your CRM." />
      <PlanBanner />
      <Card>
        <div className="form-grid">
          <Field label="Client Name" required><Input value={f.name} onChange={set('name')} placeholder="Full name" /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={set('phone')} placeholder="10-15 digit phone number" /></Field>
          <Field label="Email"><Input value={f.email} onChange={set('email')} placeholder="name@email.com" /></Field>
          <Field label="Lead Interest"><Input value={f.interest} onChange={set('interest')} placeholder="e.g. Kashmir Trip" /></Field>
          <Field label="Approx. Budget (₹)"><Input value={f.budget} onChange={set('budget')} placeholder="90000" /></Field>
          <Field label="Lead Status">
            <Select value={f.note} onChange={set('note')}><option value="">Select…</option><option>New Inquiry</option><option>Following up</option><option>Ready to book</option></Select>
          </Field>
          <Field label="Address" full><Textarea value={f.address} onChange={set('address')} placeholder="Complete address" /></Field>
          <Field label="City"><Input value={f.city} onChange={set('city')} /></Field>
          <Field label="State"><Input value={f.state} onChange={set('state')} /></Field>
          <Field label="Country"><Input value={f.country} onChange={set('country')} /></Field>
          <Field label="Status"><Select value={f.status} onChange={set('status')}><option>Active</option><option>Inactive</option></Select></Field>
          <Field label="Notes" full><Textarea value={f.notes} onChange={set('notes')} placeholder="Additional notes about the client" /></Field>
        </div>
        <div className="row gap-sm mt-lg">
          <Button onClick={save}>⤓ Save Client</Button>
          <Button variant="secondary" onClick={() => nav('/app/clients')}>Cancel</Button>
        </div>
      </Card>
    </div>
  )
}
