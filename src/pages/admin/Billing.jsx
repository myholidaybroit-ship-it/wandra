import { useApp, inr } from '../../store/AppContext'
import { PageHeader, Card, Button, Badge } from '../../components/ui/UI'

export default function Billing() {
  const { plans, toast } = useApp()
  return (
    <div>
      <PageHeader title="Billing & Subscription" subtitle="All plans 70% off during early access. Or buy credits instead of a plan." />
      <div className="grid grid-3">
        {plans.map((p) => (
          <Card key={p.id} dark={p.featured}>
            <div className="row-between">
              <span className="t-title-md">{p.name}</span>
              {p.featured && <Badge tone="preview">Popular</Badge>}
            </div>
            <div className="mt-sm">
              {p.oldPrice && <span className="t-body-sm c-muted" style={{ textDecoration: 'line-through', marginRight: 8 }}>{inr(p.oldPrice)}</span>}
              <span className="t-display-md">{p.price ? inr(p.price) : 'Free'}</span>
              <span className="t-body-sm c-body"> / {p.period}</span>
            </div>
            <div className="t-caption c-muted mt-xs">{p.limit} clients / month</div>
            <hr className="divider" />
            <ul className="col gap-xs">
              {p.perks.map((x) => <li key={x} className="t-body-sm" style={{ color: p.featured ? 'var(--color-on-dark-soft)' : 'var(--color-body)' }}>✓ {x}</li>)}
            </ul>
            <Button className="w-full mt-lg" variant={p.featured ? 'primary' : 'secondary'} onClick={() => toast(`${p.name} selected`)}>
              {p.price ? 'Upgrade' : 'Current Plan'}
            </Button>
          </Card>
        ))}
      </div>
      <Card className="mt-lg">
        <div className="row-between wrap gap-base">
          <div><span className="t-title-md">Prefer credits?</span><p className="t-body-sm c-body mt-xs">Buy one-off credits and spend them as you go — no monthly commitment.</p></div>
          <Button variant="secondary" onClick={() => toast('Credits — coming soon')}>Buy Credits</Button>
        </div>
      </Card>
    </div>
  )
}
