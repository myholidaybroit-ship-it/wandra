import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, DataTable, Badge, formatDate, ListSearch, Modal, PillMultiSelect, DatePicker, Field, Input } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import { downloadCsv } from '../../../utils/csv'
import { useLeadSources } from '../../../utils/sources'
import './query.css'

const STATUSES = ['New Query', 'In Progress', 'Converted', 'On Trip', 'Past Trips', 'Canceled', 'Dropped']
const PER_PAGE = 10

const EMPTY_FILTERS = {
  statuses: [], sources: [], assignees: [], interests: [], tags: [],
  budgetMin: '', budgetMax: '', travelFrom: '', travelTo: '', createdFrom: '', createdTo: '',
}

function pageWindow(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, page, page - 1, page + 1])
  const arr = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []; let prev = 0
  for (const p of arr) { if (p - prev > 1) out.push('…'); out.push(p); prev = p }
  return out
}

const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort()
const day = (iso) => (iso || '').slice(0, 10)

export default function ClientList() {
  const { clients } = useApp()
  const configuredSources = useLeadSources()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  // options derived from configured sources + whatever the data actually contains
  const opts = useMemo(() => ({
    sources: uniq([...configuredSources, ...clients.map((c) => c.source)]),
    assignees: uniq(clients.map((c) => c.query?.assignee)),
    interests: uniq(clients.map((c) => c.interest)),
    tags: uniq(clients.flatMap((c) => c.tags || [])),
  }), [clients, configuredSources])

  const rows = useMemo(() => clients.filter((c) => {
    const f = filters
    const hay = (c.name + c.email + c.phone + (c.interest || '') + (c.query?.refId || c.code || '')).toLowerCase()
    if (q && !hay.includes(q.toLowerCase())) return false
    if (f.statuses.length && !f.statuses.includes(c.tripStatus)) return false
    if (f.sources.length && !f.sources.includes(c.source)) return false
    if (f.assignees.length && !f.assignees.includes(c.query?.assignee)) return false
    if (f.interests.length && !f.interests.includes(c.interest)) return false
    if (f.tags.length && !f.tags.some((t) => (c.tags || []).includes(t))) return false
    if (f.budgetMin !== '' && (c.budget || 0) < Number(f.budgetMin)) return false
    if (f.budgetMax !== '' && (c.budget || 0) > Number(f.budgetMax)) return false
    if (f.travelFrom && (!c.query?.startDate || c.query.startDate < f.travelFrom)) return false
    if (f.travelTo && (!c.query?.startDate || c.query.startDate > f.travelTo)) return false
    if (f.createdFrom && day(c.createdAt) < f.createdFrom) return false
    if (f.createdTo && day(c.createdAt) > f.createdTo) return false
    return true
  }), [clients, q, filters])

  useEffect(() => { setPage(1) }, [q, filters])
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  // active filter chips (individually removable)
  const chips = useMemo(() => {
    const f = filters, out = []
    const push = (key, label, reset) => out.push({ key, label, reset })
    f.statuses.forEach((v) => push('statuses', `Status: ${v}`, () => setFilters((s) => ({ ...s, statuses: s.statuses.filter((x) => x !== v) }))))
    f.sources.forEach((v) => push('sources', `Source: ${v}`, () => setFilters((s) => ({ ...s, sources: s.sources.filter((x) => x !== v) }))))
    f.assignees.forEach((v) => push('assignees', `Owner: ${v}`, () => setFilters((s) => ({ ...s, assignees: s.assignees.filter((x) => x !== v) }))))
    f.interests.forEach((v) => push('interests', `Interest: ${v}`, () => setFilters((s) => ({ ...s, interests: s.interests.filter((x) => x !== v) }))))
    f.tags.forEach((v) => push('tags', `Tag: ${v}`, () => setFilters((s) => ({ ...s, tags: s.tags.filter((x) => x !== v) }))))
    if (f.budgetMin !== '' || f.budgetMax !== '') push('budget', `Budget: ${f.budgetMin ? inr(+f.budgetMin) : '₹0'} – ${f.budgetMax ? inr(+f.budgetMax) : 'any'}`, () => setFilters((s) => ({ ...s, budgetMin: '', budgetMax: '' })))
    if (f.travelFrom || f.travelTo) push('travel', `Travel: ${f.travelFrom ? formatDate(f.travelFrom) : 'any'} → ${f.travelTo ? formatDate(f.travelTo) : 'any'}`, () => setFilters((s) => ({ ...s, travelFrom: '', travelTo: '' })))
    if (f.createdFrom || f.createdTo) push('created', `Added: ${f.createdFrom ? formatDate(f.createdFrom) : 'any'} → ${f.createdTo ? formatDate(f.createdTo) : 'any'}`, () => setFilters((s) => ({ ...s, createdFrom: '', createdTo: '' })))
    return out
  }, [filters])
  const activeCount = chips.length

  const exportCsv = () => {
    const headers = ['Code', 'Name', 'Email', 'Phone', 'Status', 'Source', 'Interest', 'Budget', 'Owner', 'Travel Date', 'Nights', 'Adults', 'Children', 'From City', 'Tags', 'Added']
    const data = rows.map((r) => [
      r.query?.refId || r.code || '', r.name || '', r.email || '', r.phone || '', r.tripStatus || '',
      r.source || '', r.interest || '', r.budget || 0, r.query?.assignee || '',
      r.query?.startDate || '', r.query?.nights || '', r.query?.adults || '', r.query?.children || '',
      r.query?.fromCity || '', (r.tags || []).join('; '), day(r.createdAt),
    ])
    downloadCsv(`trips-clients-${day(new Date().toISOString())}`, headers, data)
  }

  const detailsLine = (r) => {
    const qy = r.query
    if (!qy) return r.budget > 0 ? `${inr(r.budget)} budget` : '—'
    const parts = []
    if (qy.startDate) parts.push(formatDate(qy.startDate))
    if (qy.nights) parts.push(`${qy.nights}N`)
    if (qy.adults) parts.push(`${qy.adults}A${qy.children ? `, ${qy.children}C` : ''}`)
    return parts.join(' · ') || '—'
  }

  const columns = [
    { key: 'client', head: 'Client', render: (r) => (
      <div className="row gap-sm">
        <span className="row-avatar">{r.name[0]}</span>
        <div>
          <div className="cell-strong">{r.name}</div>
          <div className="cell-sub mono">{r.query?.refId || r.code}</div>
        </div>
      </div>
    ) },
    { key: 'contact', head: 'Contact', render: (r) => (
      <div>
        <div>{r.phone || '—'}</div>
        <div className="cell-sub">{r.source || r.email}</div>
      </div>
    ) },
    { key: 'details', head: 'Details', render: (r) => (
      <div>
        <div>{r.interest || '—'}</div>
        <div className="cell-sub">{detailsLine(r)}</div>
      </div>
    ) },
    { key: 'status', head: 'Status', render: (r) => <Badge tone={r.tripStatus}>{r.tripStatus}</Badge> },
    { key: 'team', head: 'Team', render: (r) => (
      <div>
        <div>{r.query?.assignee || '—'}</div>
        <div className="cell-sub">{day(r.createdAt)}</div>
      </div>
    ) },
    { key: 'chev', head: '', align: 'right', render: () => <span className="row-chev"><Icon name="chevron" size={15} /></span> },
  ]

  return (
    <div>
      <PageHeader
        title="Trips & Clients"
        subtitle="Every client — and everything you've built for them — one click away."
        actions={<>
          <Button variant="tertiary" onClick={exportCsv} disabled={!rows.length}><Icon name="file" size={14} /> Export</Button>
          <Link to="/app/clients/new"><Button>+ New Query</Button></Link>
        </>}
      />

      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search name, phone, interest, ref…" count={rows.length} />
        <button className={`filter-btn ${activeCount ? 'on' : ''}`} onClick={() => setShowFilters(true)}>
          <Icon name="filter" size={15} /> Filters{activeCount > 0 && <span className="filter-btn-count">{activeCount}</span>}
        </button>
      </div>

      {activeCount > 0 && (
        <div className="filter-chips">
          {chips.map((c, i) => (
            <button key={i} className="filter-chip" onClick={c.reset}>{c.label}<span className="filter-chip-x">✕</span></button>
          ))}
          <button className="filter-chip-clear" onClick={() => setFilters(EMPTY_FILTERS)}>Clear all</button>
        </div>
      )}

      <DataTable columns={columns} rows={pageRows} onRowClick={(r) => nav(`/app/clients/${r.id}`)} empty="No clients match your filters." />

      {rows.length > PER_PAGE && (
        <div className="list-pager">
          <span className="list-pager-info">
            Showing {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, rows.length)} of {rows.length}
          </span>
          <div className="list-pager-nav">
            <button className="pager-btn" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            {pageWindow(safePage, totalPages).map((p, i) => (
              p === '…'
                ? <span key={`e${i}`} className="pager-gap">…</span>
                : <button key={p} className={`pager-num ${p === safePage ? 'on' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="pager-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </div>
      )}

      <ClientFilters
        open={showFilters}
        onClose={() => setShowFilters(false)}
        initial={filters}
        options={opts}
        total={clients.length}
        onApply={(f) => { setFilters(f); setShowFilters(false) }}
      />
    </div>
  )
}

/* ---------- Comprehensive filter modal ---------- */
function ClientFilters({ open, onClose, initial, options, total, onApply }) {
  const [f, setF] = useState(initial)
  useEffect(() => { if (open) setF(initial) }, [open, initial])
  const set = (patch) => setF((s) => ({ ...s, ...patch }))
  const isEmpty = JSON.stringify(f) === JSON.stringify(EMPTY_FILTERS)

  return (
    <Modal open={open} onClose={onClose} title="Filter leads" width={560}
      footer={<div className="cf-foot">
        <button className="cf-reset" onClick={() => setF(EMPTY_FILTERS)} disabled={isEmpty}>Reset all</button>
        <div className="row gap-sm">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onApply(f)}>Apply filters</Button>
        </div>
      </div>}
    >
      <div className="cf-grid">
        <Field label="Status" full>
          <PillMultiSelect value={f.statuses} options={STATUSES} onChange={(v) => set({ statuses: v })} placeholder="Any status" />
        </Field>
        <Field label="Source">
          <PillMultiSelect value={f.sources} options={options.sources} onChange={(v) => set({ sources: v })} placeholder="Any source" searchable />
        </Field>
        <Field label="Assigned to">
          <PillMultiSelect value={f.assignees} options={options.assignees} onChange={(v) => set({ assignees: v })} placeholder="Anyone" searchable />
        </Field>
        <Field label="Interest / Destination">
          <PillMultiSelect value={f.interests} options={options.interests} onChange={(v) => set({ interests: v })} placeholder="Any interest" searchable />
        </Field>
        <Field label="Tags">
          <PillMultiSelect value={f.tags} options={options.tags} onChange={(v) => set({ tags: v })} placeholder="Any tag" searchable />
        </Field>

        <Field label="Budget (min)">
          <Input type="number" min="0" value={f.budgetMin} onChange={(e) => set({ budgetMin: e.target.value })} placeholder="₹ min" />
        </Field>
        <Field label="Budget (max)">
          <Input type="number" min="0" value={f.budgetMax} onChange={(e) => set({ budgetMax: e.target.value })} placeholder="₹ max" />
        </Field>

        <Field label="Travel date from">
          <DatePicker value={f.travelFrom} onChange={(v) => set({ travelFrom: v })} placeholder="Any date" />
        </Field>
        <Field label="Travel date to">
          <DatePicker value={f.travelTo} onChange={(v) => set({ travelTo: v })} placeholder="Any date" />
        </Field>

        <Field label="Added from">
          <DatePicker value={f.createdFrom} onChange={(v) => set({ createdFrom: v })} placeholder="Any date" />
        </Field>
        <Field label="Added to">
          <DatePicker value={f.createdTo} onChange={(v) => set({ createdTo: v })} placeholder="Any date" />
        </Field>
      </div>
      <div className="cf-hint"><Icon name="panel" size={13} /> Filtering across {total} client{total === 1 ? '' : 's'}. Combine any fields — leads must match all.</div>
    </Modal>
  )
}
