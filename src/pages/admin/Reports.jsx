import { useApp, inr, computePricing } from '../../store/AppContext'
import { PageHeader, Card, BarChart, DonutChart, Badge } from '../../components/ui/UI'

export default function Reports() {
  const { packages, bookings, clients, invoices } = useApp()
  const totalValue = packages.reduce((s, p) => s + computePricing(p).grandTotal, 0)
  const componentsCost = packages.reduce((s, p) => s + computePricing(p).componentsCost, 0)
  const profit = packages.reduce((s, p) => s + computePricing(p).profit, 0)
  const received = invoices.flatMap((i) => i.payments || []).reduce((s, p) => s + p.amount, 0)

  const bars = packages.map((p) => ({ label: p.code.slice(-4), value: computePricing(p).grandTotal }))
  const donut = [
    { label: 'Components Cost', value: Math.max(1, Math.round(componentsCost / 1000)), color: '#facc15' },
    { label: 'Profit', value: Math.max(1, Math.round(profit / 1000)), color: '#16a34a' },
  ]

  return (
    <div>
      <PageHeader title="Reports" subtitle="Financial status across bookings, clients and packages." />
      <div className="grid grid-4">
        <Card pad={20}><div className="t-caption-upper c-muted">Total Package Value</div><div className="t-display-sm mt-xs">{inr(totalValue)}</div></Card>
        <Card pad={20}><div className="t-caption-upper c-muted">Components Cost</div><div className="t-display-sm mt-xs">{inr(componentsCost)}</div></Card>
        <Card pad={20}><div className="t-caption-upper c-muted">Estimated Profit</div><div className="t-display-sm mt-xs c-success">{inr(profit)}</div></Card>
        <Card pad={20}><div className="t-caption-upper c-muted">Payments Received</div><div className="t-display-sm mt-xs">{inr(received)}</div></Card>
      </div>

      <div className="grid grid-2 mt-lg">
        <Card>
          <span className="t-title-md">Package Report</span>
          <p className="t-body-sm c-body mt-xs mb-base">Total value per package.</p>
          <BarChart data={bars} color="var(--color-success)" />
        </Card>
        <Card>
          <span className="t-title-md">Cost vs Profit</span>
          <p className="t-body-sm c-body mt-xs mb-base">Components cost vs margin (₹ thousands).</p>
          <div className="row gap-xl">
            <DonutChart segments={donut} />
            <div className="col gap-sm">
              <div className="row gap-xs"><span className="theme-swatch" style={{ background: '#facc15' }} /><span className="t-body-sm">Components Cost — {inr(componentsCost)}</span></div>
              <div className="row gap-xs"><span className="theme-swatch" style={{ background: '#16a34a' }} /><span className="t-body-sm">Profit — {inr(profit)}</span></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-3 mt-lg">
        <Card pad={20}><div className="row-between"><span className="t-title-sm">Booking Report</span><Badge tone="info">{bookings.length}</Badge></div><p className="t-body-sm c-body mt-xs">Confirmed bookings to date.</p></Card>
        <Card pad={20}><div className="row-between"><span className="t-title-sm">Client Report</span><Badge tone="info">{clients.length}</Badge></div><p className="t-body-sm c-body mt-xs">Total clients in CRM.</p></Card>
        <Card pad={20}><div className="row-between"><span className="t-title-sm">Package Report</span><Badge tone="info">{packages.length}</Badge></div><p className="t-body-sm c-body mt-xs">Packages created.</p></Card>
      </div>
    </div>
  )
}
