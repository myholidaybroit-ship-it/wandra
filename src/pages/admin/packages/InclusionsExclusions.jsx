import { useState } from 'react'
import { useApp } from '../../../store/AppContext'
import { PageHeader } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './inclusions.css'

export default function InclusionsExclusions() {
  const { inclusionPresets, addInclusionPreset, removeInclusionPreset, toast } = useApp()
  return (
    <div className="ie">
      <PageHeader title="Inclusions & Exclusions"
        subtitle="Master presets — new quotes start with these ticked, and you toggle them per quote in the builder." />
      <div className="ie-grid">
        <PresetCol type="inclusions" title="Inclusions" tone="inc" mark="✓"
          sub="What every package includes by default"
          items={inclusionPresets.inclusions} onAdd={addInclusionPreset} onRemove={removeInclusionPreset} toast={toast} />
        <PresetCol type="exclusions" title="Exclusions" tone="exc" mark="✕"
          sub="Standard disclaimers — what's never included"
          items={inclusionPresets.exclusions} onAdd={addInclusionPreset} onRemove={removeInclusionPreset} toast={toast} />
      </div>
    </div>
  )
}

function PresetCol({ type, title, tone, mark, sub, items, onAdd, onRemove, toast }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (!t) return
    onAdd(type, t); setDraft(''); toast(`Added to ${title.toLowerCase()}`)
  }
  return (
    <section className={`ie-col ${tone}`}>
      <header className="ie-col-head">
        <span className="ie-col-mark">{mark}</span>
        <div className="ie-col-meta">
          <span className="ie-col-title">{title}</span>
          <span className="ie-col-sub">{sub}</span>
        </div>
        <span className="ie-col-count">{items.length}</span>
      </header>

      <div className="ie-items">
        {items.length === 0 && <div className="ie-empty">Nothing here yet — add your first preset below.</div>}
        {items.map((x) => (
          <div className="ie-item" key={x}>
            <span className="ie-item-mark">{mark}</span>
            <span className="ie-item-txt">{x}</span>
            <button className="ie-item-x" title="Remove preset" onClick={() => { onRemove(type, x); toast('Preset removed') }}>
              <Icon name="trash" size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="ie-composer">
        <input value={draft} placeholder={`Add ${type === 'inclusions' ? 'an inclusion' : 'an exclusion'}…`}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="ie-add" onClick={add} disabled={!draft.trim()}><Icon name="plus" size={14} /> Add</button>
      </div>
    </section>
  )
}
