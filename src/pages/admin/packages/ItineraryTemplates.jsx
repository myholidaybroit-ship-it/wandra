import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Badge } from '../../../components/ui/UI'

export default function ItineraryTemplates() {
  const { templates } = useApp()
  return (
    <div>
      <PageHeader title="Itinerary Templates" subtitle="Reusable day templates that auto-fill the day-wise builder."
        actions={<Button>+ New Template</Button>} />
      <div className="grid grid-3">
        {templates.map((t) => (
          <Card key={t.id}>
            <div className="row-between"><span className="t-title-sm">{t.name}</span><Badge tone="info">{t.mealPlan}</Badge></div>
            <p className="t-body-sm c-body mt-xs">{t.description}</p>
            <div className="t-caption c-muted mt-sm">Activities</div>
            <div className="t-body-sm">{t.activity}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
