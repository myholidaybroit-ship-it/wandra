import { useState } from 'react'
import { publicApi } from '../../api'
import { Card, Button, Field, Input, Textarea } from '../../components/ui/UI'

// Wandra's own marketing enquiry routes to the demo agency's public inbox
const DEMO_SLUG = 'wandra-travels'

export default function LeadInquiry() {
  const [f, setF] = useState({ name: '', email: '', phone: '', interest: '', budget: '', details: '' })
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async () => {
    if (!f.name || !f.phone) return setErr('Name and phone are required')
    try {
      await publicApi.post(`/site/${DEMO_SLUG}/lead`, { name: f.name, email: f.email, phone: f.phone, destination: f.interest, budget: Number(f.budget) || 0, comments: f.details, source: 'Lead Form' })
      setDone(true)
    } catch (ex) { setErr(ex.message || 'Could not send your inquiry') }
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
              {err && <div style={{ color: '#dc2626', fontSize: 13 }}>{err}</div>}
              <Button className="w-full" onClick={submit}>Send Inquiry</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
