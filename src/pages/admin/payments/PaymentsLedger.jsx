import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Card, Button, DataTable, Badge, Modal, Field, Input, Select, DatePicker, ListSearch, ConfirmDelete } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import { invoiceBreakup } from '../../../utils/invoiceMath'
import { downloadCsv } from '../../../utils/csv'
import './payments.css'

const TABS = ['Ledger', 'Money In', 'Money Out']
const EXPENSE_CATEGORIES = ['Hotel', 'Transport', 'Flights', 'Activities', 'DMC Package', 'Visa', 'Office', 'Marketing', 'Other']
const METHODS = ['Bank Transfer', 'UPI', 'Online', 'Cash', 'Card', 'Cheque']
const today = () => new Date().toISOString().slice(0, 10)
const monthKey = (iso) => (iso || '').slice(0, 7)
const monthLabel = (key) => {
  if (!key) return '—'
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

const blankExpense = () => ({
  date: today(), category: 'Hotel', supplier: '', description: '', amount: '',
  method: 'Bank Transfer', reference: '', gstInput: '', packageId: '', note: '',
})

export default function PaymentsLedger() {
  const { invoices, bookings, expenses, packages, addExpense, removeExpense, toast, canSeePricing } = useApp()
  const [tab, setTab] = useState('Ledger')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [f, setF] = useState(blankExpense())
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }))

  const L = useMemo(() => {
    // ── money IN ──
    // invoices are the source of truth (booking payments mirror onto them);
    // bookings without an invoice keep their own payments
    const liveInvoices = invoices.filter((i) => i.status !== 'Cancelled')
    const invPays = liveInvoices.flatMap((i) => (i.payments || []).map((p) => ({
      id: `${i.id}-${p.id || p.date}-${p.amount}`, date: p.date || '', method: p.method || '—',
      reference: p.reference || '', amount: Number(p.amount) || 0,
      who: i.clientName || '—', doc: i.code, docTo: `/app/invoices/${i.id}`,
    })))
    const bkPays = bookings
      .filter((b) => b.status !== 'Cancelled' && !b.invoiceId)
      .flatMap((b) => (b.payments || []).map((p) => ({
        id: `${b.id}-${p.id || p.date}-${p.amount}`, date: p.date || '', method: p.method || '—',
        reference: p.reference || '', amount: Number(p.amount) || 0,
        who: b.clientName || '—', doc: b.code, docTo: `/app/bookings/${b.id}`,
      })))
    const moneyIn = [...invPays, ...bkPays].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    const totalIn = moneyIn.reduce((s, p) => s + p.amount, 0)

    // ── money OUT ──
    const moneyOut = [...expenses].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    const totalOut = moneyOut.reduce((s, e) => s + (Number(e.amount) || 0), 0)
    const gstInput = moneyOut.reduce((s, e) => s + (Number(e.gstInput) || 0), 0)

    // ── tax billed on invoices (GST / TCS lines) ──
    let gstBilled = 0, tcsBilled = 0
    liveInvoices.forEach((i) => { const bk = invoiceBreakup(i); gstBilled += bk.gst + bk.itemTax; tcsBilled += bk.tcs })

    // ── monthly ledger ──
    const months = {}
    const mrow = (k) => (months[k] = months[k] || { key: k, in: 0, out: 0 })
    moneyIn.forEach((p) => { if (p.date) mrow(monthKey(p.date)).in += p.amount })
    moneyOut.forEach((e) => { if (e.date) mrow(monthKey(e.date)).out += Number(e.amount) || 0 })
    const ledger = Object.values(months).sort((a, b) => a.key.localeCompare(b.key))
    let running = 0
    ledger.forEach((m) => { m.net = m.in - m.out; running += m.net; m.running = running })
    ledger.reverse()

    return { moneyIn, totalIn, moneyOut, totalOut, gstInput, gstBilled, tcsBilled, ledger, profit: totalIn - totalOut }
  }, [invoices, bookings, expenses])

  const hitQ = (s) => String(s || '').toLowerCase().includes(q.trim().toLowerCase())
  const inRows = q ? L.moneyIn.filter((p) => hitQ(p.who) || hitQ(p.doc) || hitQ(p.reference) || hitQ(p.method)) : L.moneyIn
  const outRows = q ? L.moneyOut.filter((e) => hitQ(e.supplier) || hitQ(e.code) || hitQ(e.category) || hitQ(e.description) || hitQ(e.packageCode)) : L.moneyOut

  const saveExpense = async () => {
    if (!Number(f.amount)) return toast('Enter the amount paid')
    if (!f.supplier.trim() && !f.description.trim()) return toast('Who was paid? Add a supplier or description')
    const pkg = packages.find((p) => p.id === f.packageId)
    try {
      await addExpense({ ...f, amount: Number(f.amount), gstInput: Number(f.gstInput) || 0, packageCode: pkg?.code || '' })
      toast('Payment recorded in the ledger')
      setOpen(false); setF(blankExpense())
    } catch (ex) { toast(ex.message || 'Could not save the payment') }
  }

  const exportIn = () => downloadCsv(`money-in-${today()}`,
    ['Date', 'Client', 'Against', 'Method', 'Reference', 'Amount'],
    L.moneyIn.map((p) => [p.date, p.who, p.doc, p.method, p.reference, p.amount]))
  const exportOut = () => downloadCsv(`money-out-${today()}`,
    ['Date', 'Code', 'Supplier', 'Category', 'Description', 'Package', 'Method', 'Reference', 'GST paid', 'Amount'],
    L.moneyOut.map((e) => [e.date, e.code, e.supplier, e.category, e.description, e.packageCode, e.method, e.reference, e.gstInput || 0, e.amount]))
  const exportLedger = () => downloadCsv(`ledger-${today()}`,
    ['Month', 'Money in', 'Money out', 'Net', 'Running balance'],
    L.ledger.map((m) => [monthLabel(m.key), m.in, m.out, m.net, m.running]))

  return (
    <div className="pay">
      <PageHeader title="Payments & Ledger"
        subtitle="Every rupee in and out — customer collections, supplier payments, GST & profit in one place."
        actions={<Button onClick={() => { setF(blankExpense()); setOpen(true) }}>+ Record Supplier Payment</Button>} />

      {/* ---------- summary band ---------- */}
      {canSeePricing && (
        <div className="pay-band">
          <div className="pay-kpi"><span className="pay-kpi-k">Money In</span><span className="pay-kpi-v good">{inr(L.totalIn)}</span></div>
          <div className="pay-kpi"><span className="pay-kpi-k">Money Out</span><span className="pay-kpi-v bad">{inr(L.totalOut)}</span></div>
          <div className="pay-kpi strong"><span className="pay-kpi-k">Net Cash</span><span className={`pay-kpi-v ${L.profit >= 0 ? 'good' : 'bad'}`}>{inr(L.profit)}</span></div>
          <div className="pay-kpi"><span className="pay-kpi-k">GST on invoices</span><span className="pay-kpi-v">{inr(L.gstBilled)}</span></div>
          <div className="pay-kpi"><span className="pay-kpi-k">TCS collected</span><span className="pay-kpi-v">{inr(L.tcsBilled)}</span></div>
          <div className="pay-kpi"><span className="pay-kpi-k">GST paid (input)</span><span className="pay-kpi-v">{inr(L.gstInput)}</span></div>
        </div>
      )}

      <Card pad={0} className="mt-lg">
        <div className="seg-tabs pay-tabs">
          {TABS.map((t) => (
            <button key={t} className={`seg-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t}{t === 'Money In' ? ` · ${L.moneyIn.length}` : t === 'Money Out' ? ` · ${L.moneyOut.length}` : ''}
            </button>
          ))}
        </div>

        <div className="pay-body">
          {tab !== 'Ledger' && (
            <div className="pay-toolbar">
              <ListSearch value={q} onChange={setQ} placeholder={tab === 'Money In' ? 'Search client, invoice, reference…' : 'Search supplier, category, package…'} count={tab === 'Money In' ? inRows.length : outRows.length} />
              <Button variant="secondary" size="sm" onClick={tab === 'Money In' ? exportIn : exportOut}><Icon name="file" size={13} /> Export CSV</Button>
            </div>
          )}

          {tab === 'Ledger' && (
            <>
              <div className="pay-toolbar">
                <span className="t-body-sm c-body">Month-by-month cash movement — collections minus supplier payments & spendings.</span>
                <Button variant="secondary" size="sm" onClick={exportLedger}><Icon name="file" size={13} /> Export CSV</Button>
              </div>
              <DataTable columns={[
                { key: 'month', head: 'Month', render: (r) => <span className="cell-strong">{monthLabel(r.key)}</span> },
                { key: 'in', head: 'Money in', align: 'right', render: (r) => <span className="c-success">{inr(r.in)}</span> },
                { key: 'out', head: 'Money out', align: 'right', render: (r) => <span className="c-error">{inr(r.out)}</span> },
                { key: 'net', head: 'Net', align: 'right', render: (r) => <span className={`cell-strong ${r.net >= 0 ? 'c-success' : 'c-error'}`}>{inr(r.net)}</span> },
                { key: 'running', head: 'Running balance', align: 'right', render: (r) => <span className="cell-strong">{inr(r.running)}</span> },
              ]} rows={L.ledger} empty="No money movement yet — record payments on invoices and supplier payments here." />
            </>
          )}

          {tab === 'Money In' && (
            <DataTable columns={[
              { key: 'date', head: 'Date', render: (r) => <span className="cell-sub">{r.date || '—'}</span> },
              { key: 'who', head: 'Client', render: (r) => <span className="cell-strong">{r.who}</span> },
              { key: 'doc', head: 'Against', render: (r) => <Link className="c-link mono" to={r.docTo}>{r.doc}</Link> },
              { key: 'method', head: 'Method', render: (r) => <Badge tone="neutral">{r.method}</Badge> },
              { key: 'reference', head: 'Reference', render: (r) => <span className="cell-sub mono">{r.reference || '—'}</span> },
              { key: 'amount', head: 'Amount', align: 'right', render: (r) => <span className="cell-strong c-success">+{inr(r.amount)}</span> },
            ]} rows={inRows} empty="No collections yet — payments recorded on invoices & bookings appear here." />
          )}

          {tab === 'Money Out' && (
            <DataTable columns={[
              { key: 'date', head: 'Date', render: (r) => <span className="cell-sub">{r.date || '—'}</span> },
              { key: 'supplier', head: 'Paid to', render: (r) => (
                <div>
                  <div className="cell-strong">{r.supplier || r.description || '—'}</div>
                  <div className="cell-sub mono">{r.code}{r.packageCode ? ` · ${r.packageCode}` : ''}</div>
                </div>
              ) },
              { key: 'category', head: 'Category', render: (r) => <Badge tone="neutral">{r.category}</Badge> },
              { key: 'method', head: 'Method', render: (r) => <span className="cell-sub">{r.method || '—'}</span> },
              { key: 'reference', head: 'Reference', render: (r) => <span className="cell-sub mono">{r.reference || '—'}</span> },
              { key: 'amount', head: 'Amount', align: 'right', render: (r) => <span className="cell-strong c-error">−{inr(r.amount)}</span> },
              { key: 'act', head: '', align: 'right', render: (r) => (
                <ConfirmDelete what={`${r.code} — ${r.supplier || r.category}`} onConfirm={async () => { await removeExpense(r.id); toast('Payment removed') }} />
              ) },
            ]} rows={outRows} empty="No supplier payments yet — record what you pay hotels, DMCs & transporters for clear accounts." />
          )}
        </div>
      </Card>

      {/* ---------- record a supplier payment ---------- */}
      <Modal open={open} onClose={() => setOpen(false)} title="Record Supplier Payment" width={560}
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={saveExpense}>Save Payment</Button></>}>
        <div className="form-grid">
          <Field label="Date"><DatePicker value={f.date} onChange={set('date')} /></Field>
          <Field label="Category">
            <Select value={f.category} onChange={set('category')}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
          <Field label="Supplier / Paid to" required><Input value={f.supplier} onChange={set('supplier')} placeholder="e.g. Bali Sunrise DMC" /></Field>
          <Field label="Amount" required><Input type="number" min="0" value={f.amount} onChange={set('amount')} placeholder="e.g. 45000" /></Field>
          <Field label="Method">
            <Select value={f.method} onChange={set('method')}>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
          </Field>
          <Field label="Reference No."><Input value={f.reference} onChange={set('reference')} placeholder="TXN / UTR" /></Field>
          <Field label="Linked package" hint="Optional — ties the cost to a trip">
            <Select value={f.packageId} onChange={set('packageId')}>
              <option value="">—</option>
              {packages.map((p) => <option key={p.id} value={p.id}>{p.code} · {(p.destination || '').split(' - ')[0]}</option>)}
            </Select>
          </Field>
          <Field label="GST in this payment" hint="Optional — input credit tracking"><Input type="number" min="0" value={f.gstInput} onChange={set('gstInput')} placeholder="0" /></Field>
          <Field label="Description / Note" full><Input value={f.description} onChange={set('description')} placeholder="e.g. Hotel advance for PKG-202608-0114" /></Field>
        </div>
      </Modal>
    </div>
  )
}
