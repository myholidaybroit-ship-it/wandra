import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './inclusions.css'

/* Edit one destination's own inclusion / exclusion list — add, edit & delete.
   Reached from the Inclusions & Exclusions listing. */
export default function InclusionsExclusionsEdit() {
  const { dest } = useParams()                        // destination name (URL-decoded)
  const nav = useNavigate()
  const { inclusionPresets, addInclusionPreset, removeInclusionPreset, updateInclusionPreset, toast } = useApp()
  const ie = inclusionPresets.byDest?.[dest] || { inclusions: [], exclusions: [] }

  return (
    <div className="ie">
      <button className="ie-back" onClick={() => nav('/app/packages/inclusions')}>
        <Icon name="chevron" size={15} className="ie-back-ic" /> All destinations
      </button>
      <PageHeader title={dest}
        subtitle={`This destination's own inclusion & exclusion list — it loads in the quote builder the moment ${dest} is picked. Add, edit or remove each one individually.`} />
      <div className="ie-grid">
        <PresetCol dest={dest} type="inclusions" title="Inclusions" tone="inc" mark="✓"
          sub={`Included on ${dest} packages`}
          items={ie.inclusions} onAdd={addInclusionPreset} onUpdate={updateInclusionPreset} onRemove={removeInclusionPreset} toast={toast} />
        <PresetCol dest={dest} type="exclusions" title="Exclusions" tone="exc" mark="✕"
          sub={`Not included on ${dest} packages`}
          items={ie.exclusions} onAdd={addInclusionPreset} onUpdate={updateInclusionPreset} onRemove={removeInclusionPreset} toast={toast} />
      </div>
    </div>
  )
}

function PresetCol({ dest, type, title, tone, mark, sub, items, onAdd, onUpdate, onRemove, toast }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (!t) return
    if (items.includes(t)) { toast('That one already exists'); return }
    onAdd(dest, type, t); setDraft(''); toast(`Added to ${title.toLowerCase()} for ${dest}`)
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
        {items.length === 0 && <div className="ie-empty">No {title.toLowerCase()} yet — add the first one below.</div>}
        {items.map((x) => (
          <Item key={x} mark={mark} text={x}
            onSave={(newText) => {
              const t = newText.trim()
              if (!t || t === x) return
              if (items.includes(t)) { toast('That one already exists'); return }
              onUpdate(dest, type, x, t); toast('Updated')
            }}
            onRemove={() => { onRemove(dest, type, x); toast('Removed') }} />
        ))}
      </div>

      <div className="ie-composer">
        <input value={draft} placeholder={`Add a new ${type === 'inclusions' ? 'inclusion' : 'exclusion'}…`}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="ie-add" onClick={add} disabled={!draft.trim()}><Icon name="plus" size={14} /> Add</button>
      </div>
    </section>
  )
}

function Item({ mark, text, onSave, onRemove }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(text)
  const start = () => { setVal(text); setEditing(true) }
  const commit = () => { onSave(val); setEditing(false) }
  const cancel = () => { setVal(text); setEditing(false) }
  return (
    <div className={`ie-item ${editing ? 'editing' : ''}`}>
      <span className="ie-item-mark">{mark}</span>
      {editing ? (
        <input className="ie-item-edit" autoFocus value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel() }} />
      ) : (
        <span className="ie-item-txt" onDoubleClick={start}>{text}</span>
      )}
      <div className="ie-item-acts">
        {editing ? (
          <>
            <button className="ie-item-ic ok" title="Save" onMouseDown={(e) => e.preventDefault()} onClick={commit}><Icon name="check" size={13} strokeWidth={2.4} /></button>
            <button className="ie-item-ic" title="Cancel" onMouseDown={(e) => e.preventDefault()} onClick={cancel}><Icon name="x" size={13} /></button>
          </>
        ) : (
          <>
            <button className="ie-item-ic" title="Edit" onClick={start}><Icon name="edit" size={13} /></button>
            <button className="ie-item-ic danger" title="Remove" onClick={onRemove}><Icon name="trash" size={13} /></button>
          </>
        )}
      </div>
    </div>
  )
}
