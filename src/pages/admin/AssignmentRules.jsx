import { useRef, useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHeader, Button, PillSelect, PillMultiSelect } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import './assignment.css'

const FIELDS = [
  { key: 'destination', label: 'Destination' },
  { key: 'source', label: 'Lead source' },
  { key: 'city', label: 'Travelling from' },
]
const SOURCES = ['Website', 'Landing Page', 'Ad Form', 'Referral', 'WhatsApp', 'Walk-in', 'B2B Agent', 'Instagram']
const FB_MODES = { all: 'Round robin — whole team', members: 'Round robin — chosen members', unassigned: 'Leave unassigned' }

const initials = (n) => n.split(' ').filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
const fieldLabel = (k) => FIELDS.find((f) => f.key === k)?.label || k

/* chip composer for free-text values (cities) */
function ChipComposer({ values = [], onChange, placeholder }) {
  const [t, setT] = useState('')
  const add = () => { const v = t.trim(); if (!v) return; if (!values.includes(v)) onChange([...values, v]); setT('') }
  return (
    <div className="as-chips">
      {values.map((v) => (
        <span key={v} className="as-chip">{v}
          <button onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>✕</button>
        </span>
      ))}
      <input className="as-chip-input" value={t} placeholder={placeholder}
        onChange={(e) => setT(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} onBlur={add} />
    </div>
  )
}

/* toggleable member chips — click order = rotation order */
function MemberPicker({ team, selected = [], nextName, onToggle }) {
  return (
    <div className="as-members">
      {team.map((u) => {
        const idx = selected.indexOf(u.name)
        const on = idx >= 0
        return (
          <button key={u.id} className={`as-member ${on ? 'on' : ''} ${u.name === nextName ? 'next' : ''}`} onClick={() => onToggle(u.name)}>
            <span className="as-avatar">{initials(u.name)}</span>
            {u.name}
            {on && <span className="as-order">{idx + 1}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default function AssignmentRules() {
  const { assignment, updateAssignment, addAssignRule, updateAssignRule, removeAssignRule, users, clients, destinations, toast } = useApp()
  const [openId, setOpenId] = useState(assignment.rules[0]?.id || '')
  const dragIdx = useRef(null)
  const [overIdx, setOverIdx] = useState(null)

  const team = users.filter((u) => u.status === 'Active')
  const names = team.map((u) => u.name)

  const valueOptions = (field) => (field === 'destination' ? destinations.map((d) => d.name) : field === 'source' ? SOURCES : [])
  const nextUp = (members = [], next = 0) => {
    const pool = members.filter((m) => names.includes(m))
    return pool.length ? pool[(next || 0) % pool.length] : ''
  }

  const onDrop = (i) => {
    const from = dragIdx.current
    if (from == null || from === i) { setOverIdx(null); return }
    const rules = [...assignment.rules]
    const [moved] = rules.splice(from, 1)
    rules.splice(i, 0, moved)
    updateAssignment({ rules })
    dragIdx.current = null; setOverIdx(null)
    toast('Rule priority updated — first match wins')
  }

  const newRule = () => { const r = addAssignRule(); setOpenId(r.id); toast('Rule added — set its condition and members') }

  const summary = (r) => {
    if (!r.values?.length || !r.members?.length) return <em className="as-incomplete">Incomplete — pick condition values and members</em>
    return <>{fieldLabel(r.field)} is <strong>{r.values.join(' / ')}</strong> → rotates between <strong>{r.members.join(', ')}</strong></>
  }

  /* team load — who currently holds how many leads */
  const counts = names.map((n) => ({ name: n, count: clients.filter((c) => c.query?.assignee === n).length }))
  const maxCount = Math.max(1, ...counts.map((c) => c.count))
  const autoCount = clients.filter((c) => c.query?.assignedVia).length

  const fb = assignment.fallback || { mode: 'all', members: [], next: 0 }

  return (
    <div className="as">
      <PageHeader title="Lead Assignment"
        subtitle="Route every new enquiry to the right teammate — the first matching rule wins, and its members take turns."
        actions={<>
          <button className={`lb-publish ${assignment.enabled ? 'on' : ''}`}
            onClick={() => { updateAssignment({ enabled: !assignment.enabled }); toast(assignment.enabled ? 'Auto-assignment paused — new leads stay unassigned' : 'Auto-assignment is on') }}>
            <span className="lb-publish-dot" />{assignment.enabled ? 'Auto-assign on' : 'Auto-assign off'}
          </button>
          <Button onClick={newRule}>+ New Rule</Button>
        </>} />

      <div className="as-grid">
        {/* ============ Rules ============ */}
        <div className="as-rules">
          <div className="lb-hint"><Icon name="panel" size={13} /> Drag rules to set priority · click to edit</div>

          {assignment.rules.length === 0 && (
            <div className="as-empty">
              <span className="as-empty-mark"><Icon name="refresh" size={18} /></span>
              No rules yet — every lead goes to the fallback below.
              <button className="as-empty-btn" onClick={newRule}>Create your first rule</button>
            </div>
          )}

          {assignment.rules.map((r, i) => {
            const open = openId === r.id
            const next = nextUp(r.members, r.next)
            return (
              <div key={r.id} className={`as-rule ${overIdx === i ? 'over' : ''}`}
                draggable
                onDragStart={() => { dragIdx.current = i }}
                onDragOver={(e) => { e.preventDefault(); setOverIdx(i) }}
                onDragLeave={() => setOverIdx(null)}
                onDrop={() => onDrop(i)}
              >
                <div className="as-rule-head" onClick={() => setOpenId(open ? '' : r.id)}>
                  <span className="lb-drag">⋮⋮</span>
                  <span className="as-prio">#{i + 1}</span>
                  <div className="as-rule-meta">
                    <span className="as-rule-name">{r.name}</span>
                    <span className="as-rule-sum">{summary(r)}</span>
                  </div>
                  <label className="lb-switch" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={r.enabled}
                      onChange={(e) => { updateAssignRule(r.id, { enabled: e.target.checked }); toast(`“${r.name}” ${e.target.checked ? 'enabled' : 'disabled'}`) }} />
                    <span className="lb-switch-track"><span className="lb-switch-thumb" /></span>
                  </label>
                  <span className={`lb-chev ${open ? 'up' : ''}`}><Icon name="chevron" size={14} /></span>
                </div>

                {open && (
                  <div className="as-rule-body">
                    <label className="lb-field">
                      <span className="lb-k">Rule name</span>
                      <input className="control" value={r.name} onChange={(e) => updateAssignRule(r.id, { name: e.target.value })} />
                    </label>

                    <div className="as-when">
                      <span className="as-kw">When</span>
                      <div className="as-when-field"><PillSelect value={r.field} options={FIELDS.map((f) => f.key)} format={fieldLabel}
                        onChange={(v) => updateAssignRule(r.id, { field: v, values: [] })} /></div>
                      <span className="as-kw soft">is any of</span>
                      <div className="as-when-vals">
                        {r.field === 'city'
                          ? <ChipComposer values={r.values} onChange={(values) => updateAssignRule(r.id, { values })} placeholder="Type a city & press Enter" />
                          : <PillMultiSelect value={r.values} options={valueOptions(r.field)} placeholder={r.field === 'destination' ? 'Pick destinations…' : 'Pick sources…'}
                              onChange={(values) => updateAssignRule(r.id, { values })} />}
                      </div>
                    </div>

                    <div className="as-then">
                      <span className="as-kw">Then</span>
                      <span className="as-kw soft">round robin between</span>
                    </div>
                    <MemberPicker team={team} selected={r.members} nextName={open ? next : ''}
                      onToggle={(name) => {
                        const members = r.members.includes(name) ? r.members.filter((m) => m !== name) : [...r.members, name]
                        updateAssignRule(r.id, { members, next: 0 })
                      }} />

                    <div className="as-rule-foot">
                      {next
                        ? <span className="as-next"><span className="as-next-dot" />Next in rotation: <strong>{next}</strong></span>
                        : <span className="as-next muted">Pick at least one member</span>}
                      <button className="as-del" onClick={() => { removeAssignRule(r.id); toast(`Rule “${r.name}” deleted`) }}>
                        <Icon name="trash" size={13} /> Delete rule
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* ============ Fallback ============ */}
          <div className="as-fallback">
            <div className="as-fb-head">
              <span className="as-fb-mark"><Icon name="refresh" size={15} /></span>
              <div className="as-rule-meta">
                <span className="as-rule-name">When no rule matches</span>
                <span className="as-rule-sum">The safety net — every lead still finds an owner.</span>
              </div>
            </div>
            <div className="as-fb-body">
              <PillSelect value={fb.mode} options={Object.keys(FB_MODES)} format={(v) => FB_MODES[v]}
                onChange={(v) => updateAssignment({ fallback: { ...fb, mode: v, next: 0 } })} />
              {fb.mode === 'members' && (
                <MemberPicker team={team} selected={fb.members || []} nextName={nextUp(fb.members, fb.next)}
                  onToggle={(name) => {
                    const members = (fb.members || []).includes(name) ? fb.members.filter((m) => m !== name) : [...(fb.members || []), name]
                    updateAssignment({ fallback: { ...fb, members, next: 0 } })
                  }} />
              )}
              {fb.mode !== 'unassigned' && (
                <span className="as-next"><span className="as-next-dot" />Next in rotation: <strong>{nextUp(fb.mode === 'members' && fb.members?.length ? fb.members : names, fb.next) || '—'}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* ============ Team load ============ */}
        <div className="as-side">
          <div className="as-card">
            <div className="as-card-title">Team load</div>
            <div className="as-card-sub">Leads currently owned by each active member</div>
            {counts.map((c) => (
              <div key={c.name} className="as-load">
                <span className="as-avatar">{initials(c.name)}</span>
                <div className="as-load-mid">
                  <span className="as-load-name">{c.name}</span>
                  <span className="as-load-track"><span className="as-load-bar" style={{ width: `${(c.count / maxCount) * 100}%` }} /></span>
                </div>
                <span className="as-load-n">{c.count}</span>
              </div>
            ))}
            <div className="as-card-foot">{autoCount} lead{autoCount === 1 ? '' : 's'} auto-assigned by rules so far</div>
          </div>
          <p className="lb-note">Members come from <strong>User Management</strong> — only Active members are picked. Turning a rule off keeps its rotation position.</p>
        </div>
      </div>
    </div>
  )
}
