import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button } from '../../../components/ui/UI'

export default function InclusionsExclusions() {
  const { inclusionPresets } = useApp()
  return (
    <div>
      <PageHeader title="Inclusions & Exclusions" subtitle="Reusable presets that auto-fill the package wizard."
        actions={<Button>+ Add Preset</Button>} />
      <div className="grid grid-2">
        <Card>
          <span className="t-title-md c-success">Inclusions</span>
          <hr className="divider" />
          {inclusionPresets.inclusions.map((x) => <div className="check-line" key={x}>✓ {x}</div>)}
        </Card>
        <Card>
          <span className="t-title-md c-error">Exclusions</span>
          <hr className="divider" />
          {inclusionPresets.exclusions.map((x) => <div className="check-line" key={x}>✕ {x}</div>)}
        </Card>
      </div>
    </div>
  )
}
