import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { Card, Button, Field, Input, Textarea } from '../../components/ui/UI'

export default function LeadInquiry() {
  const { addClient, toast } = useApp()
  const [f, setF] = useState({ name: '', email: '', phone: '', interest: '', budget: '', details: '' })
  const [done, setDone] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = () => {
    if (!f.name || !f.phone) return toast('Name and phone are required')
    addClient({ name: f.name, email: f.email, phone: f.phone, interest: f.interest, budget: Number(f.budget) || 0, note: 'New Inquiry', source: 'Lead Form', address: '', city: '', state: '', country: 'India' })
    setDone(true); toast('Inquiry sent — the lead is now in the CRM')
  }
  return (
    <div className="section" style={{ display: 'grid', placeItems: 'center' }}>
      <Card pad={32} style={{ maxWidth: 520, width: '100%' }}>
        {done ? (
          <div className="text-center">
            <div className="feat-icon" style={{ margin: '0 auto', background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>✓</div>
            <h2 className="t-display-sm mt-base">Thank you!</h2>
            <p className="t-body-md c-body mt-xs">Our travel experts will get in touch with you shortly.</p>
          </div>
        ) : (
          <>
            <h2 className="t-display-sm">Plan Your Dream Vacation</h2>
            <p className="t-body-sm c-body mt-xs mb-lg">Fill out this form and our travel experts will get in touch with you.</p>
            <div className="col gap-base">
              <Field label="Full Name" required><Input value={f.name} onChange={set('name')} /></Field>
              <div className="form-grid">
                <Field label="Email Address"><Input value={f.email} onChange={set('email')} /></Field>
                <Field label="Phone Number" required><Input value={f.phone} onChange={set('phone')} /></Field>
              </div>
              <div className="form-grid">
                <Field label="Preferred Destination"><Input value={f.interest} onChange={set('interest')} placeholder="e.g. Kashmir" /></Field>
                <Field label="Approx. Budget"><Input value={f.budget} onChange={set('budget')} placeholder="50000" /></Field>
              </div>
              <Field label="Additional Details"><Textarea value={f.details} onChange={set('details')} placeholder="Tell us more about your travel plans…" /></Field>
              <Button className="w-full" onClick={submit}>Send Inquiry</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
