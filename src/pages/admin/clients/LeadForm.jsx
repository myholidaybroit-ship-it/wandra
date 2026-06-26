import { useState } from 'react'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input } from '../../../components/ui/UI'

export default function LeadForm() {
  const { toast } = useApp()
  const link = `${window.location.origin}/inquiry`
  const [title, setTitle] = useState('Plan Your Dream Vacation')
  const copy = () => { navigator.clipboard?.writeText(link); toast('Lead form link copied') }
  return (
    <div>
      <PageHeader title="Lead Capture Form" subtitle="Embed this form on your ads or website — submissions land directly in your CRM." />
      <div className="grid grid-2">
        <Card>
          <span className="t-title-md">Form Settings</span>
          <hr className="divider" />
          <Field label="Form Title"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Fields (always on)" hint="Full Name, Email, Phone, Preferred Destination, Budget, Details" full>
            <div className="row wrap gap-xs">
              {['Full Name', 'Email', 'Phone', 'Destination', 'Budget', 'Details'].map((x) => (
                <span className="badge badge-neutral" key={x}>{x}</span>
              ))}
            </div>
          </Field>
          <div className="row gap-sm mt-base">
            <Button onClick={() => toast('Lead form saved')}>Save Form</Button>
            <Button variant="secondary" onClick={copy}>Copy Public Link</Button>
          </div>
          <div className="mono t-caption c-muted mt-base" style={{ wordBreak: 'break-all', background: 'var(--color-surface-strong)', padding: 12, borderRadius: 8 }}>{link}</div>
        </Card>
        <Card>
          <span className="t-title-md">Live Preview</span>
          <hr className="divider" />
          <div className="t-display-sm c-ink">{title}</div>
          <p className="t-body-sm c-body mt-xs mb-base">Fill out this form and our travel experts will get in touch with you.</p>
          <div className="col gap-sm">
            <Input placeholder="Full Name *" disabled />
            <div className="form-grid"><Input placeholder="Email *" disabled /><Input placeholder="Phone *" disabled /></div>
            <div className="form-grid"><Input placeholder="Preferred Destination" disabled /><Input placeholder="Approx. Budget" disabled /></div>
            <Button className="w-full" disabled>Send Inquiry</Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
