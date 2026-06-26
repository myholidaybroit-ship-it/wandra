import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp, inr, computePricing } from '../../../store/AppContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Select, Textarea, DataTable } from '../../../components/ui/UI'

export default function ClientDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { clients, packages, bookings, invoices, updateClient, toast } = useApp()
  const c = clients.find((x) => x.id === id)
  const [tab, setTab] = useState('overview')
  const [edit, setEdit] = useState(false)
  const [f, setF] = useState(c || {})
  if (!c) return <div>Client not found. <Link className="c-link" to="/app/clients">Back</Link></div>

  const cPkgs = packages.filter((p) => p.clientId === c.id || p.clientName === c.name)
  const cBookings = bookings.filter((b) => b.clientName === c.name)
  const cInvoices = invoices.filter((i) => i.clientId === c.id || i.clientName === c.name)
  const lifetime = cInvoices.flatMap((i) => i.payments || []).reduce((s, p) => s + p.amount, 0)

  const save = () => { updateClient(c.id, f); toast('Client updated'); setEdit(false) }

  return (
    <div>
      <PageHeader title={c.name} subtitle={`${c.code} · ${c.city || ''}`}
        actions={<>
          <Link to="/app/clients"><Button variant="secondary" size="sm">← Back</Button></Link>
          <Button variant="secondary" size="sm" onClick={() => { setF(c); setEdit(true) }}>✎ Edit</Button>
          <Link to="/app/packages/new"><Button size="sm">+ New Package</Button></Link>
        </>} />

      <div className="detail-grid">
        <div className="col gap-lg">
          <Card>
            <div className="row-between"><span className="t-title-md">CRM</span><Badge tone={c.leadTemp}>{c.leadTemp}</Badge></div>
            <hr className="divider" />
            <div className="kv-grid">
              <KV k="Lead Interest" v={c.interest || '—'} />
              <KV k="Budget" v={inr(c.budget)} />
              <KV k="Source" v={c.source || '—'} />
              <KV k="Status" v={c.status} />
              <KV k="Note" v={c.note || '—'} />
              <KV k="Created" v={c.createdAt} />
            </div>
            <hr className="divider" />
            <div className="row gap-xs wrap">
              <span className="t-body-sm c-body">Move lead:</span>
              {['Cold', 'Warm', 'Hot'].map((t) => (
                <Button key={t} size="sm" variant={c.leadTemp === t ? 'primary' : 'secondary'} onClick={() => { updateClient(c.id, { leadTemp: t }); toast(`Lead marked ${t}`) }}>{t}</Button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="tabs">
              {['overview', 'packages', 'bookings', 'invoices'].map((t) => (
                <span key={t} className={`pill-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</span>
              ))}
            </div>
            <div className="mt-base">
              {tab === 'overview' && (
                <div className="kv-grid">
                  <KV k="Phone" v={c.phone} /><KV k="Email" v={c.email} />
                  <KV k="Address" v={c.address || '—'} /><KV k="City" v={c.city || '—'} />
                  <KV k="State" v={c.state || '—'} /><KV k="Country" v={c.country || '—'} />
                </div>
              )}
              {tab === 'packages' && <DataTable columns={[
                { key: 'code', head: 'Package', render: (r) => <Link className="c-link mono" to={`/app/packages/${r.id}`}>{r.code}</Link> },
                { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
                { key: 'total', head: 'Total', align: 'right', render: (r) => inr(computePricing(r).grandTotal) },
              ]} rows={cPkgs} empty="No packages yet." />}
              {tab === 'bookings' && <DataTable columns={[
                { key: 'code', head: 'Booking', render: (r) => <Link className="c-link mono" to={`/app/bookings/${r.id}`}>{r.code}</Link> },
                { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
                { key: 'value', head: 'Value', align: 'right', render: (r) => inr(r.value) },
              ]} rows={cBookings} empty="No bookings yet." />}
              {tab === 'invoices' && <DataTable columns={[
                { key: 'code', head: 'Invoice', render: (r) => <Link className="c-link mono" to={`/app/invoices/${r.id}`}>{r.code}</Link> },
                { key: 'status', head: 'Status', render: (r) => <Badge tone={r.status}>{r.status}</Badge> },
              ]} rows={cInvoices} empty="No invoices yet." />}
            </div>
          </Card>
        </div>

        <div className="col gap-lg">
          <Card className="fin-card">
            <span className="t-title-md">Lifetime Value</span>
            <hr className="divider" />
            <div className="fin-line"><span className="c-body">Packages</span><span className="cell-strong">{cPkgs.length}</span></div>
            <div className="fin-line"><span className="c-body">Bookings</span><span className="cell-strong">{cBookings.length}</span></div>
            <div className="fin-line"><span className="c-body">Invoices</span><span className="cell-strong">{cInvoices.length}</span></div>
            <hr className="divider" />
            <div className="fin-line total"><span>Paid to date</span><span className="c-success">{inr(lifetime)}</span></div>
          </Card>
        </div>
      </div>

      <Modal open={edit} onClose={() => setEdit(false)} title="Edit Client" width={560}
        footer={<><Button variant="secondary" onClick={() => setEdit(false)}>Cancel</Button><Button onClick={save}>Save</Button></>}>
        <div className="form-grid">
          <Field label="Name"><Input value={f.name || ''} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone || ''} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={f.email || ''} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Interest"><Input value={f.interest || ''} onChange={(e) => setF({ ...f, interest: e.target.value })} /></Field>
          <Field label="Budget"><Input value={f.budget || ''} onChange={(e) => setF({ ...f, budget: Number(e.target.value) || 0 })} /></Field>
          <Field label="Source"><Select value={f.source || ''} onChange={(e) => setF({ ...f, source: e.target.value })}><option value="">—</option><option>Ad Form</option><option>Referral</option><option>Walk-in</option><option>Lead Form</option></Select></Field>
          <Field label="Status"><Select value={f.status || 'Active'} onChange={(e) => setF({ ...f, status: e.target.value })}><option>Active</option><option>Inactive</option></Select></Field>
          <Field label="Note"><Input value={f.note || ''} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
          <Field label="Address" full><Textarea value={f.address || ''} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  )
}
function KV({ k, v }) { return <div className="kv"><span className="kv-k">{k}</span><span className="kv-v">{v}</span></div> }
