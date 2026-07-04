import { Link } from 'react-router-dom'
import { useApp, inr, computePricing } from '../../store/AppContext'
import { Card, Sparkline, AreaChart, BarChart, DonutChart, HBars, Funnel, ProgressRing, StackBar, StackedColumns, ComboChart, Heatmap } from '../../components/ui/UI'
import './dashboard.css'

/* Monochrome data-viz ramp — ink → silver */
const MONO = {
  ink: '#111113',
  charcoal: '#3a3a40',
  steel: '#71717a',
  stone: '#9b9ba3',
  silver: '#c9c9cf',
  mist: '#e3e3e8',
}
const RAMP = [MONO.ink, MONO.charcoal, MONO.steel, MONO.stone, MONO.silver]

function delta(series) {
  const cur = series.at(-1), prev = series.at(-2) || 1
  return Math.round(((cur - prev) / prev) * 100)
}

function Kpi({ label, value, series, deltaPct }) {
  const up = deltaPct >= 0
  return (
    <Card className="kpi" pad={20}>
      <div className="t-caption-upper c-muted">{label}</div>
      <div className="t-heading-md c-ink kpi-value">{value}</div>
      <div className="kpi-foot">
        <div>
          <span className={`kpi-delta ${up ? 'up' : 'down'}`}>{up ? '↑' : '↓'} {Math.abs(deltaPct)}%</span>
          <div className="kpi-delta-note mt-xs">vs last month</div>
        </div>
        <Sparkline data={series} color={MONO.ink} w={110} h={36} />
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { packages, bookings, clients, invoices, dashboardSeries, dashboardAnalytics: A } = useApp()
  const revenue = invoices.flatMap((i) => i.payments || []).reduce((s, p) => s + p.amount, 0)
  const grossRevenue = packages.reduce((s, p) => s + computePricing(p).grandTotal, 0)
  const activePackages = packages.filter((p) => p.status !== 'Cancelled').length

  const fyGross = A.grossByMonth.reduce((s, v) => s + v, 0)
  const fyCollected = A.collectedByMonth.reduce((s, v) => s + v, 0)
  const monthCollected = A.collectedByMonth.at(-1)
  const targetPct = (monthCollected / A.monthlyTarget) * 100
  const collectPct = Math.min(100, (revenue / (grossRevenue || 1)) * 100)

  const sourceSegs = A.leadSources.map((s, i) => ({ ...s, color: RAMP[i % RAMP.length] }))
  const statusSegs = A.packageStatusMix.map((s, i) => ({ ...s, color: RAMP[i % RAMP.length] }))
  const agingBars = A.invoiceAging.map((b, i) => ({ ...b, color: RAMP[i % RAMP.length] }))

  return (
    <div className="dash">
      {/* KPI row */}
      <div className="grid grid-4">
        <Kpi label="Total Revenue" value={inr(revenue)} series={dashboardSeries.revenue} deltaPct={delta(A.collectedByMonth)} />
        <Kpi label="Total Bookings" value={bookings.length} series={dashboardSeries.bookings} deltaPct={delta(A.bookingsByMonth)} />
        <Kpi label="Active Packages" value={activePackages} series={dashboardSeries.packages} deltaPct={delta(A.grossByMonth)} />
        <Kpi label="Total Clients" value={clients.length} series={dashboardSeries.clients} deltaPct={delta(A.weeklyInquiries)} />
      </div>

      {/* Revenue trend + target / collection */}
      <div className="dash-row-main mt-lg">
        <Card pad={24}>
          <div className="chart-head">
            <div>
              <div className="chart-kicker">Revenue trend · last 12 months</div>
              <div className="chart-big-num">{inr(fyGross * 1000)}</div>
              <div className="t-caption c-muted">gross package value · {inr(fyCollected * 1000)} collected</div>
            </div>
            <div className="chart-legend inline">
              <span className="legend-item"><span className="legend-dot" style={{ background: MONO.ink }} /><span className="legend-label">Gross value</span></span>
              <span className="legend-item"><span className="legend-dot" style={{ background: MONO.steel }} /><span className="legend-label">Collected</span></span>
            </div>
          </div>
          <div className="mt-base">
            <AreaChart
              labels={A.months}
              formatY={(v) => `${v}k`}
              formatV={(v) => `₹${v}k`}
              series={[
                { name: 'Gross value', data: A.grossByMonth, color: MONO.ink, fill: false },
                { name: 'Collected', data: A.collectedByMonth, color: MONO.steel },
              ]}
            />
          </div>
        </Card>

        <div className="col gap-md">
          <Card pad={24}>
            <div className="chart-kicker">This month's target</div>
            <div className="ring-row mt-base">
              <ProgressRing pct={targetPct} label="of target" color={MONO.ink} />
              <div className="ring-meta">
                <span><strong>₹{monthCollected}k</strong> collected</span>
                <span>Target <strong>₹{A.monthlyTarget}k</strong></span>
                <span>Gap <strong>₹{Math.max(0, A.monthlyTarget - monthCollected)}k</strong></span>
              </div>
            </div>
          </Card>
          <Card pad={24}>
            <div className="row-between">
              <span className="t-title-sm">Collection</span>
              <Link className="t-body-sm c-link" to="/app/reports">Reports</Link>
            </div>
            <hr className="divider" />
            <div className="fin-row"><span className="c-body">Gross Revenue</span><span className="cell-strong">{inr(grossRevenue)}</span></div>
            <div className="fin-row"><span className="c-body">Payments Received</span><span className="cell-strong">{inr(revenue)}</span></div>
            <div className="fin-row"><span className="c-body">Outstanding</span><span className="cell-strong">{inr(grossRevenue - revenue)}</span></div>
            <div className="fin-bar"><span style={{ width: `${collectPct}%` }} /></div>
            <div className="t-caption c-muted mt-xs">{Math.round(collectPct)}% collected</div>
          </Card>
        </div>
      </div>

      {/* Funnel / sources / status mix */}
      <div className="dash-row-3 mt-lg">
        <Card pad={24}>
          <span className="t-title-sm">Lead Conversion Funnel</span>
          <hr className="divider" />
          <Funnel stages={A.leadFunnel} color={MONO.ink} />
        </Card>
        <Card pad={24}>
          <span className="t-title-sm">Lead Sources</span>
          <hr className="divider" />
          <div className="row gap-lg wrap">
            <DonutChart segments={sourceSegs} size={132} thickness={20} />
            <div className="chart-legend col gap-xs flex-1">
              {sourceSegs.map((s) => (
                <div className="legend-item" key={s.label}>
                  <span className="legend-dot" style={{ background: s.color }} />
                  <span className="legend-label">{s.label}</span>
                  <span className="legend-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
        <Card pad={24}>
          <span className="t-title-sm">Package Status Mix</span>
          <hr className="divider" />
          <StackBar segments={statusSegs} />
        </Card>
      </div>

      {/* Cashflow + invoice aging */}
      <div className="dash-row-main mt-lg">
        <Card pad={24}>
          <div className="chart-head">
            <div>
              <div className="chart-kicker">Cashflow · collected vs outstanding</div>
              <div className="t-caption c-muted mt-xs">monthly gross split (₹ thousands)</div>
            </div>
            <div className="chart-legend inline">
              <span className="legend-item"><span className="legend-dot" style={{ background: MONO.ink }} /><span className="legend-label">Collected</span></span>
              <span className="legend-item"><span className="legend-dot" style={{ background: MONO.silver }} /><span className="legend-label">Outstanding</span></span>
            </div>
          </div>
          <div className="mt-base">
            <StackedColumns
              labels={A.months}
              formatY={(v) => `${v}k`}
              series={[
                { name: 'Collected', data: A.collectedByMonth, color: MONO.ink },
                { name: 'Outstanding', data: A.grossByMonth.map((g, i) => g - A.collectedByMonth[i]), color: MONO.silver },
              ]}
            />
          </div>
        </Card>
        <Card pad={24}>
          <span className="t-title-sm">Invoice Aging</span>
          <hr className="divider" />
          <HBars data={agingBars} formatV={(v) => `₹${v}k`} />
          <div className="t-caption c-muted mt-base">outstanding receivables by age bucket</div>
        </Card>
      </div>

      {/* Profit & margin / bookings / destinations */}
      <div className="dash-row-mix mt-lg">
        <Card pad={24}>
          <div className="chart-head">
            <div>
              <div className="chart-kicker">Profit & margin</div>
              <div className="t-caption c-muted mt-xs">monthly profit (₹k) with margin % trend</div>
            </div>
            <div className="chart-legend inline">
              <span className="legend-item"><span className="legend-dot" style={{ background: MONO.silver }} /><span className="legend-label">Profit</span></span>
              <span className="legend-item"><span className="legend-dot" style={{ background: MONO.ink }} /><span className="legend-label">Margin %</span></span>
            </div>
          </div>
          <div className="mt-base">
            <ComboChart labels={A.months} bars={A.profitByMonth} line={A.marginPctByMonth} barColor={MONO.silver} lineColor={MONO.ink} formatY={(v) => `${v}k`} />
          </div>
        </Card>
        <Card pad={24}>
          <div className="row-between">
            <span className="t-title-sm">Bookings by Month</span>
            <span className="t-caption c-muted">{A.bookingsByMonth.reduce((s, v) => s + v, 0)} total</span>
          </div>
          <hr className="divider" />
          <BarChart data={A.months.map((m, i) => ({ label: m, value: A.bookingsByMonth[i] }))} color={MONO.ink} h={190} />
        </Card>
        <Card pad={24}>
          <span className="t-title-sm">Top Destinations</span>
          <hr className="divider" />
          <HBars data={A.topDestinations} color={MONO.ink} />
          <div className="t-caption c-muted mt-base">packages sold per destination</div>
        </Card>
      </div>

      {/* Heatmap / cities / weekly inquiries */}
      <div className="dash-row-mix mt-lg">
        <Card pad={24}>
          <div className="row-between">
            <span className="t-title-sm">Inquiry Heatmap</span>
            <span className="t-caption c-muted">last 8 weeks</span>
          </div>
          <hr className="divider" />
          <Heatmap rows={A.heatDays} cols={A.heatWeeks} values={A.inquiryHeatmap} rgb="17, 17, 19" />
          <div className="row-between mt-base">
            <span className="t-caption c-muted">inquiries per day</span>
            <div className="heat-scale">
              <span>Less</span>
              <span className="heat-scale-cells">
                {[0.08, 0.28, 0.5, 0.74, 1].map((o) => <span key={o} style={{ background: `rgba(17, 17, 19, ${o})` }} />)}
              </span>
              <span>More</span>
            </div>
          </div>
        </Card>
        <Card pad={24}>
          <span className="t-title-sm">Clients by City</span>
          <hr className="divider" />
          <HBars data={A.clientCities} color={MONO.ink} />
          <div className="t-caption c-muted mt-base">where your travelers come from</div>
        </Card>
        <Card pad={24}>
          <div className="row-between">
            <span className="t-title-sm">Inquiries This Week</span>
            <span className="t-caption c-muted">{A.weeklyInquiries.reduce((s, v) => s + v, 0)} total</span>
          </div>
          <hr className="divider" />
          <BarChart data={A.weekDays.map((d, i) => ({ label: d, value: A.weeklyInquiries[i] }))} color={MONO.ink} h={190} showValues />
        </Card>
      </div>
    </div>
  )
}
