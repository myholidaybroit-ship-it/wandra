import { useState } from 'react'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Card, Button, Input } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'

export default function InclusionsExclusions() {
  const { inclusionPresets, addInclusionPreset, removeInclusionPreset, toast } = useApp()
  return (
    <div>
      <PageHeader title="Inclusions & Exclusions" subtitle="Master presets — tick these on/off inside the quote builder." />
      <div className="grid grid-2">
        <PresetCol type="inclusions" title="Inclusions" tone="c-success" mark="✓"
          items={inclusionPresets.inclusions} onAdd={addInclusionPreset} onRemove={removeInclusionPreset} toast={toast} />
        <PresetCol type="exclusions" title="Exclusions" tone="c-error" mark="✕"
          items={inclusionPresets.exclusions} onAdd={addInclusionPreset} onRemove={removeInclusionPreset} toast={toast} />
      </div>
    </div>
  )
}

function PresetCol({ type, title, tone, mark, items, onAdd, onRemove, toast }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (!t) return
    onAdd(type, t); setDraft(''); toast(`Added to ${title.toLowerCase()}`)
  }
  return (
    <Card>
      <span className={`t-title-md ${tone}`}>{title}</span>
      <hr className="divider" />
      {items.map((x) => (
        <div className="check-line row-between" key={x}>
          <span>{mark} {x}</span>
          <button className="btn-icon" title="Remove preset" onClick={() => onRemove(type, x)}><Icon name="trash" size={14} /></button>
        </div>
      ))}
      <div className="row gap-sm mt-base">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Add ${title.toLowerCase().slice(0, -1)}…`}
          onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Button size="sm" variant="secondary" onClick={add}>Add</Button>
      </div>
    </Card>
  )
}
