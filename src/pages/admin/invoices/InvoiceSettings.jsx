import { useState } from 'react'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Field, Input, Select, Textarea } from '../../../components/ui/UI'

export default function InvoiceSettings() {
  const { toast } = useApp()
  const [f, setF] = useState({ prefix: 'INV-', nextNo: '0004', defaultGst: '18', defaultDue: '15', terms: 'Payable within 15 days. 50% advance to confirm booking.', footer: 'Thank you for travelling with Wandra.' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <div>
      <PageHeader title="Invoice Settings" subtitle="Defaults applied to every new invoice." />
      <div className="grid grid-2">
        <Card>
          <span className="t-title-md">Numbering & Tax</span>
          <hr className="divider" />
          <div className="form-grid">
            <Field label="Invoice Prefix"><Input value={f.prefix} onChange={set('prefix')} /></Field>
            <Field label="Next Number"><Input value={f.nextNo} onChange={set('nextNo')} /></Field>
            <Field label="Default GST %"><Input value={f.defaultGst} onChange={set('defaultGst')} /></Field>
            <Field label="Default Due (days)"><Input value={f.defaultDue} onChange={set('defaultDue')} /></Field>
            <Field label="Default Invoice Type" full><Select><option>Non-GST</option><option>GST</option></Select></Field>
          </div>
        </Card>
        <Card>
          <span className="t-title-md">Terms & Footer</span>
          <hr className="divider" />
          <Field label="Payment Terms" full><Textarea value={f.terms} onChange={set('terms')} /></Field>
          <div className="mt-base"><Field label="Invoice Footer" full><Textarea value={f.footer} onChange={set('footer')} /></Field></div>
          <Button className="mt-lg" onClick={() => toast('Invoice settings saved')}>Save Settings</Button>
        </Card>
      </div>
    </div>
  )
}
