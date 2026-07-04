import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHeader, Card, Button, Field, Input } from '../../components/ui/UI'
import { ImageInput } from '../../components/ui/ImageInput'

export default function Settings() {
  const { agency, setAgency, toast } = useApp()
  const [f, setF] = useState({ ...agency, ...agency.bank })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    setAgency({ ...agency, name: f.name, logo: f.logo || '', email: f.email, phone: f.phone, website: f.website, address: f.address, gstin: f.gstin,
      bank: { accountName: f.accountName, bankName: f.bankName, accountNumber: f.accountNumber, ifsc: f.ifsc } })
    toast('Settings saved — these details now appear on all itineraries, vouchers & invoices')
  }
  return (
    <div>
      <PageHeader title="Settings" subtitle="Your agency profile feeds every itinerary, voucher, invoice & the bank-transfer block." />
      <div className="grid grid-2">
        <Card>
          <span className="t-title-md">Agency Profile</span>
          <hr className="divider" />
          <div className="col gap-base">
            <ImageInput label="Agency logo" value={f.logo || ''} maxW={400}
              onChange={(v) => setF({ ...f, logo: v })}
              hint="PNG with transparency looks best — shows on every itinerary, PDF, voucher & invoice" />
            <Field label="Brand / Company Name"><Input value={f.name} onChange={set('name')} /></Field>
            <Field label="Email"><Input value={f.email} onChange={set('email')} /></Field>
            <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
            <Field label="Website"><Input value={f.website} onChange={set('website')} /></Field>
            <Field label="Address"><Input value={f.address} onChange={set('address')} /></Field>
            <Field label="GSTIN / Tax No."><Input value={f.gstin} onChange={set('gstin')} /></Field>
          </div>
        </Card>
        <Card>
          <span className="t-title-md">Bank Details (Secure Your Booking)</span>
          <hr className="divider" />
          <div className="col gap-base">
            <Field label="Account Name"><Input value={f.accountName} onChange={set('accountName')} /></Field>
            <Field label="Bank Name"><Input value={f.bankName} onChange={set('bankName')} /></Field>
            <Field label="Account Number"><Input value={f.accountNumber} onChange={set('accountNumber')} /></Field>
            <Field label="IFSC Code"><Input value={f.ifsc} onChange={set('ifsc')} /></Field>
          </div>
          <Button className="mt-lg" onClick={save}>Save Settings</Button>
        </Card>
      </div>
    </div>
  )
}
