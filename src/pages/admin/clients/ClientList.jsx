import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, DataTable, Badge, PillSelect, formatDate, ListSearch } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'

const STATUSES = ['All', 'New Query', 'In Progress', 'Converted', 'On Trip', 'Past Trips', 'Canceled', 'Dropped']
const PER_PAGE = 10

function pageWindow(page, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, page, page - 1, page + 1])
  const arr = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const out = []; let prev = 0
  for (const p of arr) { if (p - prev > 1) out.push('…'); out.push(p); prev = p }
  return out
}

export default function ClientList() {
  const { clients } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)

  const rows = clients.filter((c) =>
    (status === 'All' || c.tripStatus === status) &&
    (c.name + c.email + c.phone + (c.interest || '')).toLowerCase().includes(q.toLowerCase())
  )

  useEffect(() => { setPage(1) }, [q, status])
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const pageRows = rows.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  const detailsLine = (r) => {
    const q = r.query
    if (!q) return r.budget > 0 ? `${inr(r.budget)} budget` : '—'
    const parts = []
    if (q.startDate) parts.push(formatDate(q.startDate))
    if (q.nights) parts.push(`${q.nights}N`)
    if (q.adults) parts.push(`${q.adults}A${q.children ? `, ${q.children}C` : ''}`)
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
        <div className="cell-sub">{r.createdAt}</div>
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
          <Button variant="tertiary">Export</Button>
          <Link to="/app/clients/new"><Button>+ New Query</Button></Link>
        </>}
      />

      <div className="list-toolbar">
        <ListSearch value={q} onChange={setQ} placeholder="Search name, phone, interest…" count={rows.length} />
        <PillSelect value={status} options={STATUSES} onChange={setStatus} format={(s) => (s === 'All' ? 'All statuses' : s)} />
      </div>

      <DataTable columns={columns} rows={pageRows} onRowClick={(r) => nav(`/app/clients/${r.id}`)} empty="No clients match your search." />

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
    </div>
  )
}
