import { Link } from 'react-router-dom'
import { useApp, inr, computePricing } from '../../store/AppContext'
import { Card, Button, Badge, Sparkline } from '../../components/ui/UI'
import './dashboard.css'

function Kpi({ label, value, series, color }) {
  return (
    <Card className="kpi" pad={20}>
      <div className="t-caption-upper c-muted">{label}</div>
      <div className="t-display-md c-ink kpi-value">{value}</div>
      <div className="kpi-spark"><Sparkline data={series} color={color} w={200} h={40} /></div>
    </Card>
  )
}

export default function Dashboard() {
  const { agency, packages, bookings, clients, invoices, dashboardSeries, recentActivity } = useApp()
  const revenue = invoices.flatMap((i) => i.payments || []).reduce((s, p) => s + p.amount, 0)
  const grossRevenue = packages.reduce((s, p) => s + computePricing(p).grandTotal, 0)
  const activePackages = packages.filter((p) => p.status !== 'Cancelled').length

  return (
    <div>
      <div className="dash-hero">
        <div>
          <h1 className="t-display-lg c-ink">Welcome back, {agency.name.split(' ')[0]}!</h1>
          <p className="t-body-md c-body mt-xs">Manage your travel agency operations efficiently.</p>
        </div>
        <Badge tone="neutral">ADMIN</Badge>
      </div>

      <div className="grid grid-4 mt-lg">
        <Kpi label="Total Revenue" value={inr(revenue)} series={dashboardSeries.revenue} color="var(--color-success)" />
        <Kpi label="Total Bookings" value={bookings.length} series={dashboardSeries.bookings} color="var(--color-text-link)" />
        <Kpi label="Active Packages" value={activePackages} series={dashboardSeries.packages} color="var(--color-preview)" />
        <Kpi label="Total Clients" value={clients.length} series={dashboardSeries.clients} color="var(--color-ink)" />
      </div>

      <div className="dash-lower mt-lg">
        {/* Financial overview */}
        <Card pad={22}>
          <div className="row-between">
            <span className="t-title-md">Financial Overview</span>
            <Link className="t-body-sm c-link" to="/app/reports">View Reports</Link>
          </div>
          <hr className="divider" />
          <div className="fin-row"><span className="c-body">Gross Revenue</span><span className="cell-strong">{inr(grossRevenue)}</span></div>
          <div className="fin-row"><span className="c-body">Payments Received</span><span className="cell-strong c-success">{inr(revenue)}</span></div>
          <div className="fin-row"><span className="c-body">Outstanding</span><span className="cell-strong">{inr(grossRevenue - revenue)}</span></div>
          <div className="fin-bar"><span style={{ width: `${Math.min(100, (revenue / (grossRevenue || 1)) * 100)}%` }} /></div>
          <div className="t-caption c-muted mt-xs">{Math.round((revenue / (grossRevenue || 1)) * 100)}% collected</div>
        </Card>

        {/* Recent bookings */}
        <Card pad={22}>
          <div className="row-between">
            <span className="t-title-md">Recent Bookings</span>
            <Link className="t-body-sm c-link" to="/app/bookings">View All</Link>
          </div>
          <hr className="divider" />
          {bookings.map((b) => (
            <Link to={`/app/bookings/${b.id}`} key={b.id} className="recent-row">
              <div>
                <div className="cell-strong">{b.code}</div>
                <div className="cell-sub">{b.clientName} · {b.travelDate}</div>
              </div>
              <div className="text-right">
                <div className="cell-strong">{inr(b.value)}</div>
                <Badge tone="confirmed">{b.status}</Badge>
              </div>
            </Link>
          ))}
        </Card>

        {/* Recent activity */}
        <Card pad={22}>
          <span className="t-title-md">Recent Activity</span>
          <hr className="divider" />
          {recentActivity.map((a) => (
            <div className="act-row" key={a.id}>
              <span className="act-dot" />
              <div>
                <div className="t-body-sm cell-strong">{a.text}</div>
                <div className="cell-sub">{a.sub}</div>
              </div>
              <span className="act-time">{a.date}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card className="mt-lg" pad={22}>
        <div className="row-between wrap gap-base">
          <div>
            <span className="t-title-md">Create your next itinerary in minutes</span>
            <p className="t-body-sm c-body mt-xs">Turn an inquiry into a professional package, quotation, booking & invoice.</p>
          </div>
          <Button as="a" href="/app/packages/new">+ Create New Package</Button>
        </div>
      </Card>
    </div>
  )
}
