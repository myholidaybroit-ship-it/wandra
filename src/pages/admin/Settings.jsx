import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHeader, Card, Button, Field, Input } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import { ImageInput } from '../../components/ui/ImageInput'
import { DEFAULT_LEAD_SOURCES } from '../../utils/sources'
import './settings.css'

export default function Settings() {
  const { agency, setAgency, toast } = useApp()
  const [f, setF] = useState({ ...agency, ...agency.bank })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    setAgency({ ...agency, name: f.name, legalName: f.legalName || '', logo: f.logo || '', paymentQr: f.paymentQr || '', email: f.email, phone: f.phone, website: f.website, address: f.address, gstin: f.gstin,
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
            <Field label="Brand name" hint="Your displayed name — shown on itineraries, vouchers, PDFs & every client-facing page"><Input value={f.name} onChange={set('name')} placeholder="e.g. My Holiday Bro" /></Field>
            <Field label="Company registered name" hint="Your legal entity name — shown on invoices & tax documents. Leave blank to use the brand name."><Input value={f.legalName || ''} onChange={set('legalName')} placeholder="e.g. PUA Holiday Planner Pvt Ltd" /></Field>
            <Field label="Email"><Input value={f.email} onChange={set('email')} /></Field>
            <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
            <Field label="Website"><Input value={f.website} onChange={set('website')} /></Field>
            <Field label="Address"><Input value={f.address} onChange={set('address')} /></Field>
            <Field label="GSTIN / Tax No."><Input value={f.gstin} onChange={set('gstin')} /></Field>
          </div>
        </Card>
        <div className="col gap-base">
          <Card>
            <span className="t-title-md">Bank Details (Secure Your Booking)</span>
            <hr className="divider" />
            <div className="col gap-base">
              <Field label="Account Name"><Input value={f.accountName} onChange={set('accountName')} /></Field>
              <Field label="Bank Name"><Input value={f.bankName} onChange={set('bankName')} /></Field>
              <Field label="Account Number"><Input value={f.accountNumber} onChange={set('accountNumber')} /></Field>
              <Field label="IFSC Code"><Input value={f.ifsc} onChange={set('ifsc')} /></Field>
              <ImageInput label="UPI payment QR" value={f.paymentQr || ''} maxW={600}
                onChange={(v) => setF({ ...f, paymentQr: v })}
                hint="Your own scan-to-pay QR — prints on quote PDFs next to your Payment Details block" />
            </div>
            <Button className="mt-lg" onClick={save}>Save Settings</Button>
          </Card>

          <LeadSourcesCard />
        </div>
      </div>
    </div>
  )
}

/* ---------- Lead sources — add / rename / remove, used across lead capture & filters ---------- */
function LeadSourcesCard() {
  const { agency, setAgency, toast } = useApp()
  const initial = Array.isArray(agency.leadSources) && agency.leadSources.length ? agency.leadSources : DEFAULT_LEAD_SOURCES
  const [list, setList] = useState(initial)
  const [next, setNext] = useState('')
  const [busy, setBusy] = useState(false)

  const dirty = JSON.stringify(list) !== JSON.stringify(initial)
  const add = () => {
    const v = next.trim()
    if (!v) return
    if (list.some((s) => s.toLowerCase() === v.toLowerCase())) { toast('That source already exists'); return }
    setList([...list, v]); setNext('')
  }
  const remove = (i) => setList(list.filter((_, x) => x !== i))
  const rename = (i, v) => setList(list.map((s, x) => (x === i ? v : s)))

  const save = async () => {
    const clean = []
    const seen = new Set()
    for (const s of list) { const t = s.trim(); if (t && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); clean.push(t) } }
    if (!clean.length) { toast('Keep at least one source'); return }
    setBusy(true)
    try { await setAgency({ leadSources: clean }); setList(clean); toast('Lead sources updated') }
    catch { toast('Could not save sources') } finally { setBusy(false) }
  }

  return (
    <Card>
      <span className="t-title-md">Lead Sources</span>
      <p className="t-body-sm c-steel mt-xs">Customise where your leads come from. These appear when creating a query, on the client page, in assignment rules & filters.</p>
      <hr className="divider" />

      <div className="src-list">
        {list.map((s, i) => (
          <div className="src-row" key={i}>
            <span className="src-dot" />
            <input className="control src-input" value={s} onChange={(e) => rename(i, e.target.value)} />
            <button className="src-del" title="Remove source" onClick={() => remove(i)}><Icon name="trash" size={15} /></button>
          </div>
        ))}
        {list.length === 0 && <div className="t-body-sm c-steel">No sources yet — add your first below.</div>}
      </div>

      <div className="src-add">
        <Input value={next} placeholder="Add a source (e.g. Facebook, Google Ads)…"
          onChange={(e) => setNext(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())} />
        <Button variant="secondary" onClick={add} disabled={!next.trim()}><Icon name="plus" size={14} /> Add</Button>
      </div>

      <Button className="mt-lg" onClick={save} disabled={!dirty || busy}>{busy ? 'Saving…' : 'Save sources'}</Button>
    </Card>
  )
}
