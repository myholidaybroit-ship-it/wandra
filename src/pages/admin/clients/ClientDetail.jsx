import { useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp, inr, computePricing } from '../../../store/AppContext'
import { api } from '../../../api'
import { fileToUploadable } from '../../../utils/image'
import { Card, Button, Badge, Modal, Field, Input, Select, Textarea, DataTable, EmptyState, PillSelect } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import { useLeadSources } from '../../../utils/sources'
import '../packages/detail.css'
import './client-hub.css'

const TABS = ['Overview', 'Packages', 'Bookings', 'Invoices', 'Quotations', 'Documents']
const TRIP_STATUSES = ['New Query', 'In Progress', 'Converted', 'On Trip', 'Past Trips', 'Canceled', 'Dropped']
const DOC_TYPES = ['Passport', 'PAN / Aadhaar', 'Visa', 'Flight Ticket', 'Hotel Voucher', 'Travel Insurance', 'Itinerary', 'Other']

const invoiceTotal = (i) => (i.items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0)
const invoicePaid = (i) => (i.payments || []).reduce((s, p) => s + p.amount, 0)
const fmtSize = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

export default function ClientDetail() {
  const { id } = useParams()
  const { clients, packages, bookings, invoices, quotations, setQuotationStatus, updateClient, addClientDoc, removeClientDoc, toast, canSeePricing } = useApp()
  const sources = useLeadSources()
  const c = clients.find((x) => x.id === id)
  const [tab, setTab] = useState('Overview')
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState(c || {})
  const [docOpen, setDocOpen] = useState(false)
  const [docFile, setDocFile] = useState(null)
  const [docName, setDocName] = useState('')
  const [docCat, setDocCat] = useState('Passport')
  const fileRef = useRef(null)
  if (!c) return <div>Client not found. <Link className="c-link" to="/app/clients">Back</Link></div>

  const cPkgs = packages.filter((p) => p.clientId === c.id || p.clientName === c.name)
  const cBookings = bookings.filter((b) => b.clientName === c.name)
  const cInvoices = invoices.filter((i) => i.clientId === c.id || i.clientName === c.name)
  const cQuotes = quotations.filter((q) => q.client === c.name)
  const lifetime = cInvoices.reduce((s, i) => s + invoicePaid(i), 0)

  const save = () => { updateClient(c.id, f); toast('Client updated'); setEdit(false) }
  const newPkgTo = `/app/clients/${c.id}/start`
  const docs = c.docs || []

  const openDocModal = () => { setDocFile(null); setDocName(''); setDocCat('Passport'); setDocOpen(true) }
  const onDocFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDocFile(file)
    setDocName((n) => n || file.name.replace(/\.[^.]+$/, ''))
  }
  const [docSaving, setDocSaving] = useState(false)
  const saveDoc = async () => {
    if (!docFile) return toast('Choose a file first')
    if (!docName.trim()) return toast('Give the document a name')
    setDocSaving(true)
    try {
      const dataUrl = await fileToUploadable(docFile, 1800)
      const url = await api.upload(dataUrl, 'client-docs')
      await addClientDoc(c.id, {
        name: docName.trim(), category: docCat,
        fileName: docFile.name, size: docFile.size, mime: docFile.type, url,
      })
      toast('Document uploaded')
      setDocOpen(false)
    } catch { toast('Could not upload that document') } finally { setDocSaving(false) }
  }

  const counts = { Packages: cPkgs.length, Bookings: cBookings.length, Invoices: cInvoices.length, Quotations: cQuotes.length, Documents: docs.length }

  return (
    <div className="client-hub">
      {/* ---- Client header: everything about this client at a glance ---- */}
      <Card pad={24}>
        <div className="ch-head">
          <span className="ch-avatar">{c.name[0]}</span>
          <div className="ch-id">
            <div className="row gap-sm wrap">
              <h1 className="t-heading-md c-ink">{c.name}</h1>
              <Badge tone={c.tripStatus}>{c.tripStatus}</Badge>
            </div>
            <div className="ch-meta">
              <span className="mono">{c.code}</span>
              {c.phone && <span>{c.phone}</span>}
              {c.email && <span>{c.email}</span>}
              {c.city && <span>{c.city}</span>}
            </div>
          </div>
          <div className="ch-actions">
            <Link to="/app/clients"><Button variant="tertiary" size="sm">← Back</Button></Link>
            <Button variant="tertiary" size="sm" onClick={() => { setF(c); setEdit(true) }}>Edit</Button>
            <Link to={newPkgTo}><Button size="sm">+ New Package</Button></Link>
          </div>
        </div>
        <div className="ch-stats">
          <div className="ch-stat"><span className="ch-stat-v">{cPkgs.length}</span><span className="ch-stat-k">Packages</span></div>
          <div className="ch-stat"><span className="ch-stat-v">{cBookings.length}</span><span className="ch-stat-k">Bookings</span></div>
          <div className="ch-stat"><span className="ch-stat-v">{cInvoices.length}</span><span className="ch-stat-k">Invoices</span></div>
          <div className="ch-stat"><span className="ch-stat-v">{cQuotes.length}</span><span className="ch-stat-k">Quotations</span></div>
          {canSeePricing && <>
            <div className="ch-stat"><span className="ch-stat-v">{inr(lifetime)}</span><span className="ch-stat-k">Paid to date</span></div>
            <div className="ch-stat"><span className="ch-stat-v">{inr(c.budget)}</span><span className="ch-stat-k">Budget</span></div>
          </>}
        </div>
      </Card>

      {/* ---- One place for the whole journey ---- */}
      <Card pad={0} className="mt-lg ch-card">
        <div className="seg-tabs ch-tabs">
          {TABS.map((t) => (
            <button key={t} className={`seg-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t}{counts[t] > 0 && <span className="ch-tab-count">{counts[t]}</span>}
            </button>
          ))}
        </div>

        <div className="ch-body">
          {tab === 'Overview' && (
            <div>
              <div className="kv-grid kv-grid-3">
                <KV k="Lead Interest" v={c.interest || '—'} />
                {canSeePricing && <KV k="Budget" v={inr(c.budget)} />}
                <KV k="Source" v={c.source || '—'} />
                <KV k="Phone" v={c.phone} />
                <KV k="Email" v={c.email} />
                <KV k="City" v={`${c.city || '—'}${c.state ? ', ' + c.state : ''}`} />
                <KV k="Address" v={c.address || '—'} />
                <KV k="Note" v={c.note || '—'} />
                <KV k="Created" v={(c.createdAt || '').slice(0, 10)} />
              </div>
              <hr className="divider" />
              <div className="tstep-wrap">
                <span className="trip-pipe-k">Trip status</span>
                <div className="tstep-row">
                  <div className={`tstep-track ${TRIP_STATUSES.indexOf(c.tripStatus) > 4 ? 'halted' : ''}`}>
                    {TRIP_STATUSES.slice(0, 5).map((s, i) => {
                      const cur = TRIP_STATUSES.indexOf(c.tripStatus)
                      const done = cur > i && cur <= 4
                      const now = c.tripStatus === s
                      return (
                        <button key={s} className={`tstep ${now ? 'now' : ''} ${done ? 'done' : ''}`}
                          onClick={() => { updateClient(c.id, { tripStatus: s }); toast(`Moved to ${s}`) }}>
                          <span className="tstep-node">{done ? <Icon name="check" size={10} strokeWidth={3.2} /> : now ? <i /> : null}</span>
                          <span className="tstep-label">{s}</span>
                        </button>
                      )
                    })}
                  </div>
                  <div className="tstep-term">
                    <span className="tstep-term-k">or mark as</span>
                    {TRIP_STATUSES.slice(5).map((s) => (
                      <button key={s} className={`tstep-term-link ${c.tripStatus === s ? 'on' : ''}`}
                        onClick={() => { updateClient(c.id, { tripStatus: s }); toast(`Moved to ${s}`) }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'Packages' && (
            cPkgs.length === 0 ? (
              <HubEmpty text="No packages yet — build one in under a minute." cta="+ New Package" to={newPkgTo} />
            ) : (
              <>
                <div className="ch-tab-actions"><Link to={newPkgTo}><Button size="sm">+ New Package</Button></Link></div>
                <DataTable columns={[
                  { key: 'code', head: 'Package', render: (r) => <Link className="cell-strong c-link" to={`/app/packages/${r.id}`}>{r.code}</Link> },
                  { key: 'destination', head: 'Destination', render: (r) => <span>{r.destination?.split(' - ')[0] || '—'}</span> },
                  { key: 'start', head: 'Start', render: (r) => <span className="cell-sub">{r.startDate || '—'}</span> },
                  { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
                  ...(canSeePricing ? [{ key: 'total', head: 'Total', align: 'right', render: (r) => <span className="cell-strong">{inr(computePricing(r).grandTotal)}</span> }] : []),
                  { key: 'open', head: '', align: 'right', render: (r) => <Link to={`/app/packages/${r.id}`}><Button variant="tertiary" size="sm">Open</Button></Link> },
                ]} rows={cPkgs} />
              </>
            )
          )}

          {tab === 'Bookings' && (
            cBookings.length === 0 ? (
              <HubEmpty text="No bookings yet — confirm a package to create one." cta="Go to packages" onClick={() => setTab('Packages')} />
            ) : (
              <DataTable columns={[
                { key: 'code', head: 'Booking', render: (r) => <Link className="cell-strong c-link" to={`/app/bookings/${r.id}`}>{r.code}</Link> },
                { key: 'travelDate', head: 'Travel date', render: (r) => <span className="cell-sub">{r.travelDate}</span> },
                { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
                ...(canSeePricing ? [
                  { key: 'value', head: 'Value', align: 'right', render: (r) => inr(r.value) },
                  { key: 'paid', head: 'Collected', align: 'right', render: (r) => <span className="c-success">{inr(r.paid)}</span> },
                ] : []),
                { key: 'open', head: '', align: 'right', render: (r) => <Link to={`/app/bookings/${r.id}`}><Button variant="tertiary" size="sm">Open</Button></Link> },
              ]} rows={cBookings} />
            )
          )}

          {tab === 'Invoices' && (
            cInvoices.length === 0 ? (
              <HubEmpty text="No invoices yet." cta="+ New Invoice" to="/app/invoices/new" />
            ) : (
              <>
                <div className="ch-tab-actions"><Link to="/app/invoices/new"><Button size="sm">+ New Invoice</Button></Link></div>
                <DataTable columns={[
                  { key: 'code', head: 'Invoice', render: (r) => <Link className="cell-strong c-link" to={`/app/invoices/${r.id}`}>{r.code}</Link> },
                  { key: 'issueDate', head: 'Issued', render: (r) => <span className="cell-sub">{r.issueDate}</span> },
                  { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
                  ...(canSeePricing ? [
                    { key: 'total', head: 'Total', align: 'right', render: (r) => inr(invoiceTotal(r)) },
                    { key: 'balance', head: 'Balance', align: 'right', render: (r) => <span className="cell-strong">{inr(invoiceTotal(r) - invoicePaid(r))}</span> },
                  ] : []),
                  { key: 'open', head: '', align: 'right', render: (r) => <Link to={`/app/invoices/${r.id}`}><Button variant="tertiary" size="sm">Open</Button></Link> },
                ]} rows={cInvoices} />
              </>
            )
          )}

          {tab === 'Documents' && (
            docs.length === 0 ? (
              <HubEmpty text="No documents yet — store passports, tickets, visas & vouchers here." cta="+ Upload Document" onClick={openDocModal} />
            ) : (
              <>
                <div className="ch-tab-actions"><Button size="sm" onClick={openDocModal}>+ Upload Document</Button></div>
                <DataTable columns={[
                  { key: 'doc', head: 'Document', render: (r) => (
                    <div className="row gap-sm">
                      <span className="doc-ic"><Icon name="file" size={15} /></span>
                      <div>
                        <div className="cell-strong">{r.name}</div>
                        <div className="cell-sub">{r.fileName}</div>
                      </div>
                    </div>
                  ) },
                  { key: 'category', head: 'Type', render: (r) => <Badge tone="neutral">{r.category}</Badge> },
                  { key: 'size', head: 'Size', render: (r) => <span className="cell-sub">{fmtSize(r.size)}</span> },
                  { key: 'uploadedAt', head: 'Uploaded', render: (r) => <span className="cell-sub">{r.uploadedAt}</span> },
                  { key: 'act', head: '', align: 'right', render: (r) => (
                    <div className="row-actions">
                      <Button variant="tertiary" size="sm" as="a" href={r.url} target="_blank" rel="noreferrer">View</Button>
                      <Button variant="danger" size="sm" onClick={() => { removeClientDoc(c.id, r.id); toast('Document removed') }}>Delete</Button>
                    </div>
                  ) },
                ]} rows={docs} />
              </>
            )
          )}

          {tab === 'Quotations' && (
            cQuotes.length === 0 ? (
              <HubEmpty text="No quotations yet — price a package to send one." cta="+ New Package" to={newPkgTo} />
            ) : (
              <DataTable columns={[
                { key: 'packageCode', head: 'Package', render: (r) => <span className="cell-strong mono">{r.packageCode}</span> },
                { key: 'travelDate', head: 'Travel date', render: (r) => <span className="cell-sub">{r.travelDate}</span> },
                ...(canSeePricing ? [{ key: 'amount', head: 'Amount', align: 'right', render: (r) => inr(r.amount) }] : []),
                { key: 'status', head: 'Status', render: (r) => (
                  r.status === 'Confirmed'
                    ? <Badge tone="confirmed">Confirmed</Badge>
                    : <div className="qs-toggle">
                        {['Draft', 'Sent'].map((s) => (
                          <button key={s} className={`qs-pill ${r.status === s ? 'on' : ''}`}
                            onClick={() => { setQuotationStatus(r.id, s); toast(`Quotation marked ${s}`) }}>{s}</button>
                        ))}
                      </div>
                ) },
              ]} rows={cQuotes} />
            )
          )}
        </div>
      </Card>

      <Modal open={docOpen} onClose={() => setDocOpen(false)} title="Upload Document" width={480}
        footer={<><Button variant="secondary" onClick={() => setDocOpen(false)}>Cancel</Button><Button onClick={saveDoc}>Save Document</Button></>}>
        <div className="col gap-base">
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={onDocFile} />
          <button className="upload-box doc-drop" onClick={() => fileRef.current?.click()}>
            {docFile
              ? <span className="row gap-xs center"><Icon name="file" size={15} /> {docFile.name} · {fmtSize(docFile.size)} — click to change</span>
              : <span className="row gap-xs center"><Icon name="upload" size={16} /> Click to choose a file — PDF, image or doc</span>}
          </button>
          <Field label="Document Name" required hint="Name it the way you'll look for it later">
            <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. Ramesh – Passport" />
          </Field>
          <Field label="Type">
            <PillSelect value={docCat} options={DOC_TYPES} onChange={setDocCat} />
          </Field>
        </div>
      </Modal>

      <Modal open={edit} onClose={() => setEdit(false)} title="Edit Client" width={560}
        footer={<><Button variant="secondary" onClick={() => setEdit(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="form-grid">
          <Field label="Name"><Input value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone || ''} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Interest"><Input value={f.interest || ''} onChange={(e) => setF({ ...f, interest: e.target.value })} /></Field>
          <Field label="Budget"><Input value={f.budget || ''} onChange={(e) => setF({ ...f, budget: Number(e.target.value) || 0 })} /></Field>
          <Field label="Source"><Select value={f.source || ''} onChange={(e) => setF({ ...f, source: e.target.value })}><option value="">—</option>{(sources.includes(f.source) || !f.source ? sources : [f.source, ...sources]).map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Trip Status"><Select value={f.tripStatus || 'New Query'} onChange={(e) => setF({ ...f, tripStatus: e.target.value })}>{TRIP_STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
          <Field label="Note"><Input value={f.note || ''} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
          <Field label="Address" full><Textarea value={f.address || ''} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}

function HubEmpty({ text, cta, to, onClick }) {
  return (
    <div className="ch-empty">
      <EmptyState icon="✦" title={text} />
      <div className="text-center">
        {to
          ? <Link to={to}><Button size="sm">{cta}</Button></Link>
          : <Button size="sm" onClick={onClick}>{cta}</Button>}
      </div>
    </div>
  )
}

function KV({ k, v }) { return <div className="kv"><span className="kv-k">{k}</span><span className="kv-v">{v}</span></div> }
