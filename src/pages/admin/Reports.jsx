import { useMemo, useState } from 'react'
import { useApp, inr, computePricing } from '../../store/AppContext'
import { Button, DonutChart, Funnel, HBars, StackBar } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import { downloadCsv } from '../../utils/csv'
import './reports.css'

/* monochrome ramp — reports stay ink-only like the dashboard */
const RAMP = ['#111113', '#43434b', '#75757e', '#a5a5ae', '#d4d4d8', '#ececef']
const PIPE = ['New Query', 'In Progress', 'Converted', 'On Trip', 'Past Trips']
const LOST = ['Canceled', 'Dropped']
const DIMS = [
  { key: 'assignee', label: 'Sales Person', of: (c) => c.query?.assignee || 'Unassigned' },
  { key: 'source', label: 'Trip Source', of: (c) => c.source || 'Direct' },
  { key: 'destination', label: 'Destination', of: (c) => (c.interest || 'General Inquiry').split(',')[0].trim() },
]

const monthLabel = (p) => new Date(p.y, p.m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
const inMonth = (iso, p) => {
  if (!iso) return false
  const d = new Date(iso + 'T00:00:00')
  return d.getFullYear() === p.y && d.getMonth() === p.m
}

export default function Reports() {
  const { clients, packages, bookings, quotations } = useApp()
  const [mode, setMode] = useState('all')            // 'all' | 'month'
  const [period, setPeriod] = useState({ y: 2026, m: 5 }) // June 2026 — where the demo data lives
  const [dim, setDim] = useState('assignee')
  const [q, setQ] = useState('')

  const nav = (n) => setPeriod((p) => { const d = new Date(p.y, p.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })

  const R = useMemo(() => {
    const hit = (iso) => mode === 'all' || inMonth(iso, period)
    const leads = clients.filter((c) => hit(c.createdAt))
    const count = (s) => leads.filter((c) => c.tripStatus === s).length
    const stat = Object.fromEntries([...PIPE, ...LOST].map((s) => [s, count(s)]))
    const total = leads.length
    const movedPlus = stat['Converted'] + stat['On Trip'] + stat['Past Trips']
    const lost = stat['Canceled'] + stat['Dropped']
    const convPct = total ? Math.round((movedPlus / total) * 100) : 0

    // financial (same period lens)
    const pPkgs = packages.filter((p) => hit(p.createdAt))
    const quoted = quotations.filter((qt) => pPkgs.some((p) => p.id === qt.packageId))
    const quotedValue = quoted.reduce((s, x) => s + (x.amount || 0), 0)
    const pBk = bookings.filter((b) => b.status !== 'Cancelled' && hit(b.travelDate))
    const bookedValue = pBk.reduce((s, b) => s + b.value, 0)
    const collected = pBk.reduce((s, b) => s + (b.paid || 0), 0)
    const profit = pPkgs.reduce((s, p) => s + (computePricing(p).profit || 0), 0)

    // breakdown by active dimension
    const of = DIMS.find((d) => d.key === dim).of
    const groups = {}
    leads.forEach((c) => {
      const k = of(c)
      groups[k] = groups[k] || { name: k, total: 0, ...Object.fromEntries(PIPE.map((s) => [s, 0])), lost: 0 }
      groups[k].total++
      if (LOST.includes(c.tripStatus)) groups[k].lost++
      else if (groups[k][c.tripStatus] != null) groups[k][c.tripStatus]++
    })
    const rows = Object.values(groups)
      .map((g) => ({ ...g, conv: g.total ? Math.round(((g['Converted'] + g['On Trip'] + g['Past Trips']) / g.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total)

    // chart data
    const bySource = {}
    leads.forEach((c) => { const k = c.source || 'Direct'; bySource[k] = (bySource[k] || 0) + 1 })
    const donut = Object.entries(bySource).sort((a, b) => b[1] - a[1])
      .map(([label, value], i) => ({ label, value, color: RAMP[Math.min(i, RAMP.length - 1)] }))
    const byDest = {}
    leads.forEach((c) => { const k = (c.interest || 'General').split(',')[0].trim(); byDest[k] = (byDest[k] || 0) + 1 })
    const dests = Object.entries(byDest).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({ label, value }))
    const funnel = [
      { label: 'Leads', value: total },
      { label: 'Working', value: Math.max(0, total - stat['New Query'] - lost) },
      { label: 'Converted', value: movedPlus },
      { label: 'Travelled', value: stat['On Trip'] + stat['Past Trips'] },
    ]
    const mix = [...PIPE.map((s, i) => ({ label: s, value: stat[s], color: RAMP[i] })), { label: 'Lost', value: lost, color: '#e5b8b8' }]
      .filter((x) => x.value > 0)
    const revenue = [
      { label: 'Quoted', value: quotedValue },
      { label: 'Booked', value: bookedValue },
      { label: 'Collected', value: collected },
      { label: 'Outstanding', value: Math.max(0, bookedValue - collected) },
      { label: 'Est. profit', value: profit },
    ]
    return { leads, stat, total, movedPlus, lost, convPct, quoted: quoted.length, quotedValue, bookings: pBk.length, bookedValue, collected, profit, rows, donut, dests, funnel, mix, revenue }
  }, [clients, packages, bookings, quotations, mode, period, dim])

  const shown = R.rows.filter((r) => r.name.toLowerCase().includes(q.trim().toLowerCase()))
  const dimLabel = DIMS.find((d) => d.key === dim).label
  const periodTag = mode === 'all' ? 'all-time' : monthLabel(period).replace(' ', '-').toLowerCase()

  const exportSummary = () => downloadCsv(`report-${dim}-${periodTag}`,
    [dimLabel, 'Total', ...PIPE, 'Lost', 'Conversion %'],
    shown.map((r) => [r.name, r.total, ...PIPE.map((s) => r[s]), r.lost, `${r.conv}%`]))

  const exportLeads = () => downloadCsv(`leads-${periodTag}`,
    ['Name', 'Phone', 'Email', 'Status', 'Source', 'Sales person', 'Destination', 'Start date', 'Nights', 'Adults', 'Children', 'Created'],
    R.leads.map((c) => [c.name, c.phone, c.email, c.tripStatus, c.source || 'Direct', c.query?.assignee || '', c.interest || '', c.query?.startDate || '', c.query?.nights ?? '', c.query?.adults ?? '', c.query?.children ?? '', c.createdAt]))

  return (
    <div className="rp">
      {/* ---------- header ---------- */}
      <div className="rp-head">
        <div>
          <h1 className="rp-title">Reports</h1>
          <p className="rp-sub">Leads, pipeline & revenue — sliced any way you need.</p>
        </div>
        <div className="rp-controls">
          <div className="rp-mode">
            <button className={`rp-mode-btn ${mode === 'all' ? 'on' : ''}`} onClick={() => setMode('all')}>All time</button>
            <button className={`rp-mode-btn ${mode === 'month' ? 'on' : ''}`} onClick={() => setMode('month')}>Monthly</button>
          </div>
          {mode === 'month' && (
            <div className="rp-monthnav">
              <button className="rp-mn-btn" onClick={() => nav(-1)}>‹</button>
              <span className="rp-mn-label">{monthLabel(period)}</span>
              <button className="rp-mn-btn" onClick={() => nav(1)}>›</button>
            </div>
          )}
          <Button variant="secondary" size="sm" onClick={exportLeads}><Icon name="file" size={14} /> Export leads (Excel)</Button>
        </div>
      </div>

      {/* ---------- KPI band ---------- */}
      <div className="rp-band">
        <div className="rp-band-period">
          <span className="rp-band-k">{mode === 'all' ? 'All time' : monthLabel(period)}</span>
          <span className="rp-band-sub">{R.total} lead{R.total === 1 ? '' : 's'}</span>
        </div>
        <Kpi k="Total Leads" v={R.total} />
        <Kpi k="New Query" v={R.stat['New Query']} />
        <Kpi k="In Progress" v={R.stat['In Progress']} />
        <Kpi k="Moved to Trips" v={R.movedPlus} />
        <Kpi k="Conversion" v={`${R.convPct}%`} strong />
        <Kpi k="Lost" v={R.lost} dim />
      </div>

      {/* ---------- financial band ---------- */}
      <div className="rp-band fin">
        <Kpi k={`Quotes (${R.quoted})`} v={inr(R.quotedValue)} />
        <Kpi k={`Bookings (${R.bookings})`} v={inr(R.bookedValue)} />
        <Kpi k="Collected" v={inr(R.collected)} good />
        <Kpi k="Outstanding" v={inr(Math.max(0, R.bookedValue - R.collected))} bad />
        <Kpi k="Est. Profit" v={inr(R.profit)} good />
      </div>

      {/* ---------- charts ---------- */}
      <div className="rp-charts">
        <div className="rp-chart">
          <div className="rp-chart-t">Pipeline funnel</div>
          <Funnel stages={R.funnel} color="#111113" />
        </div>
        <div className="rp-chart">
          <div className="rp-chart-t">Lead sources</div>
          {R.donut.length
            ? <div className="rp-donut"><DonutChart segments={R.donut} size={150} thickness={20} centerValue={String(R.total)} centerLabel="leads" />
                <div className="rp-legend">{R.donut.map((s) => <div className="rp-leg" key={s.label}><i style={{ background: s.color }} />{s.label} · {s.value}</div>)}</div>
              </div>
            : <div className="rp-empty">No leads in this period.</div>}
        </div>
        <div className="rp-chart">
          <div className="rp-chart-t">Top destinations</div>
          {R.dests.length ? <HBars data={R.dests} color="#111113" /> : <div className="rp-empty">No leads in this period.</div>}
        </div>
      </div>

      <div className="rp-charts two">
        <div className="rp-chart">
          <div className="rp-chart-t">Status mix</div>
          {R.mix.length ? <><StackBar segments={R.mix} />
            <div className="rp-legend row">{R.mix.map((s) => <div className="rp-leg" key={s.label}><i style={{ background: s.color }} />{s.label} · {s.value}</div>)}</div></>
            : <div className="rp-empty">No leads in this period.</div>}
        </div>
        <div className="rp-chart">
          <div className="rp-chart-t">Revenue waterfall</div>
          <HBars data={R.revenue} color="#111113" formatV={inr} />
        </div>
      </div>

      {/* ---------- breakdown ---------- */}
      <div className="rp-break">
        <div className="rp-break-side">
          <div className="rp-break-k">Break down by</div>
          {DIMS.map((d) => (
            <button key={d.key} className={`rp-dim ${dim === d.key ? 'on' : ''}`} onClick={() => setDim(d.key)}>{d.label}</button>
          ))}
        </div>
        <div className="rp-break-main">
          <div className="rp-break-bar">
            <label className="rp-search"><Icon name="search" size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${dimLabel.toLowerCase()}…`} /></label>
            <span className="rp-break-count">{shown.length} of {R.rows.length}</span>
            <Button size="sm" variant="secondary" onClick={exportSummary}><Icon name="file" size={13} /> Export CSV</Button>
          </div>
          <div className="rp-table-wrap">
            <table className="rp-table">
              <thead>
                <tr><th>{dimLabel}</th><th>Total</th>{PIPE.map((s) => <th key={s}>{s}</th>)}<th>Lost</th><th>Conv.</th></tr>
              </thead>
              <tbody>
                {shown.length === 0 && <tr><td colSpan={9} className="rp-empty-cell">Nothing matches.</td></tr>}
                {shown.map((r) => (
                  <tr key={r.name}>
                    <td className="rp-td-name">{r.name}</td>
                    <td className="rp-td-strong">{r.total}</td>
                    {PIPE.map((s) => <td key={s} className={r[s] ? '' : 'rp-zero'}>{r[s]}</td>)}
                    <td className={r.lost ? 'rp-td-bad' : 'rp-zero'}>{r.lost}</td>
                    <td><span className="rp-conv"><i style={{ width: `${r.conv}%` }} />{r.conv}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ k, v, strong, good, bad, dim }) {
  return (
    <div className={`rp-kpi ${strong ? 'strong' : ''} ${dim ? 'dim' : ''}`}>
      <span className="rp-kpi-k">{k}</span>
      <span className={`rp-kpi-v ${good ? 'good' : ''} ${bad ? 'bad' : ''}`}>{v}</span>
    </div>
  )
}
