import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Button, Card, EmptyState, ListSearch, PillSelect, Field, Input, Select, Textarea } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import {
  TASK_TYPES, TYPE_META, PRIORITIES, LINK_KINDS, BUCKETS,
  bucketOf, dueLabel, presetDue, toLocalInput, sortQueue,
} from '../../../utils/followups'
import './followups.css'

const VIEWS = ['Open', 'Done', 'All']

/* ── one row of the queue ───────────────────────────────────── */
function TaskRow({ task, onComplete, onReopen, onSnooze, onEdit, onDelete, canSnooze }) {
  const [busy, setBusy] = useState('')
  const bucket = bucketOf(task)
  const type = TYPE_META[task.type] || TYPE_META.other
  const link = task.link?.kind ? LINK_KINDS[task.link.kind] : null
  const run = (key, fn) => async () => { setBusy(key); try { await fn() } finally { setBusy('') } }

  return (
    <div className={`fu-row ${bucket} ${task.status !== 'open' ? 'settled' : ''}`}>
      <button
        className="fu-check"
        title={task.status === 'open' ? 'Mark done' : 'Reopen'}
        disabled={!!busy}
        onClick={task.status === 'open' ? run('done', onComplete) : run('open', onReopen)}
      >
        {task.status === 'open' ? <span className="fu-check-box" /> : <Icon name="check" size={13} strokeWidth={3} />}
      </button>

      <span className={`fu-type ${task.priority}`} title={type.label}><Icon name={type.icon} size={14} /></span>

      <div className="fu-main">
        <div className="fu-title-row">
          <span className="fu-title">{task.title}</span>
          {task.priority === 'high' && task.status === 'open' && <span className="fu-flag">High</span>}
          {task.auto && <span className="fu-auto" title="Created automatically by a follow-up rule">Auto</span>}
          {task.snoozeCount > 0 && <span className="fu-snoozed" title={`Snoozed ${task.snoozeCount}×`}>Snoozed ×{task.snoozeCount}</span>}
        </div>
        {task.notes && <div className="fu-notes">{task.notes}</div>}
        <div className="fu-meta">
          <span className={`fu-due ${bucket}`}>{task.status === 'open' ? dueLabel(task) : `Done by ${task.completedByName || '—'}`}</span>
          {link && task.link.id && (
            <Link to={link.to(task.link.id)} className="fu-link">
              <Icon name={link.icon} size={12} />
              {link.label} · {task.link.code || task.link.label}
            </Link>
          )}
          {task.assigneeName ? <span className="fu-who">{task.assigneeName}</span> : <span className="fu-who unclaimed">Unclaimed</span>}
          {task.outcome && <span className="fu-outcome">“{task.outcome}”</span>}
        </div>
      </div>

      <div className="fu-actions">
        {task.status === 'open' && canSnooze && (
          <>
            <button className="fu-mini" disabled={!!busy} onClick={run('s1', () => onSnooze({ days: 1 }))}>+1d</button>
            <button className="fu-mini" disabled={!!busy} onClick={run('s3', () => onSnooze({ days: 3 }))}>+3d</button>
          </>
        )}
        <button className="fu-mini" onClick={onEdit} title="Edit follow-up"><Icon name="edit" size={13} /></button>
        <button className="fu-mini danger" onClick={onDelete} title="Delete follow-up"><Icon name="trash" size={13} /></button>
      </div>
    </div>
  )
}

/* ── create / edit form ─────────────────────────────────────── */
function TaskForm({ initial, onSave, onCancel, users, canAssign, currentUser }) {
  const [f, setF] = useState(() => ({
    title: initial?.title || '',
    type: initial?.type || 'call',
    priority: initial?.priority || 'normal',
    notes: initial?.notes || '',
    dueAt: toLocalInput(initial?.dueAt || presetDue('tomorrow')),
    assigneeName: initial?.assigneeName ?? (initial ? '' : currentUser?.name || ''),
  }))
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    if (!f.title.trim()) return
    setSaving(true)
    try { await onSave({ ...f, title: f.title.trim(), dueAt: new Date(f.dueAt).toISOString() }) }
    finally { setSaving(false) }
  }

  return (
    <Card className="fu-form" pad={20}>
      <div className="fu-form-grid">
        <Field label="What needs doing" full>
          <Input autoFocus value={f.title} onChange={set('title')} placeholder="e.g. Call Rehan about the Gulmarg upgrade"
            onKeyDown={(e) => e.key === 'Enter' && submit()} maxLength={300} />
        </Field>
        <Field label="Type">
          <Select value={f.type} onChange={set('type')}>
            {TASK_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </Select>
        </Field>
        <Field label="Priority">
          <Select value={f.priority} onChange={set('priority')}>
            {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </Select>
        </Field>
        <Field label="Due">
          <Input type="datetime-local" value={f.dueAt} onChange={set('dueAt')} />
        </Field>
        <Field label="Owner" hint={canAssign ? undefined : 'Only an admin can hand work to a teammate'}>
          <Select value={f.assigneeName} onChange={set('assigneeName')} disabled={!canAssign}>
            <option value="">Unclaimed — anyone can pick it up</option>
            {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
          </Select>
        </Field>
        <Field label="Notes" full>
          <Textarea rows={2} value={f.notes} onChange={set('notes')} placeholder="Context your future self will thank you for…" maxLength={4000} />
        </Field>
      </div>
      <div className="fu-form-foot">
        <div className="fu-presets">
          {[['today', 'Later today'], ['tomorrow', 'Tomorrow'], ['3d', 'In 3 days'], ['week', 'Next week']].map(([k, label]) => (
            <button key={k} type="button" className="fu-mini" onClick={() => setF((p) => ({ ...p, dueAt: presetDue(k) }))}>{label}</button>
          ))}
        </div>
        <div className="row gap-xs">
          <Button variant="tertiary" onClick={onCancel}>Cancel</Button>
          <Button onClick={submit} disabled={saving || !f.title.trim()}>{saving ? 'Saving…' : initial ? 'Save changes' : 'Add follow-up'}</Button>
        </div>
      </div>
    </Card>
  )
}

/* ── the page ───────────────────────────────────────────────── */
export default function FollowUps() {
  const {
    tasks, taskScope, taskSummary, reloadTasks, addTask, updateTask, completeTask,
    reopenTask, snoozeTask, removeTask, users, currentUser, hasFeature, can, toast,
  } = useApp()
  const nav = useNavigate()
  const [view, setView] = useState('Open')
  const [q, setQ] = useState('')
  const [type, setType] = useState('All types')
  const [who, setWho] = useState('Everyone')
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  const canAssign = hasFeature('tasks.assign') && can('tasksTeam')
  const canSnooze = hasFeature('tasks.snooze')
  const canAutomate = hasFeature('tasks.automation')
  const teamView = taskScope === 'team'

  useEffect(() => { reloadTasks().catch(() => {}) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return sortQueue(tasks.filter((t) => {
      if (view === 'Open' && t.status !== 'open') return false
      if (view === 'Done' && t.status !== 'done') return false
      if (type !== 'All types' && TYPE_META[t.type]?.label !== type) return false
      if (teamView && who !== 'Everyone' && (t.assigneeName || 'Unclaimed') !== who) return false
      if (!s) return true
      return [t.title, t.notes, t.link?.label, t.link?.code, t.assigneeName]
        .some((v) => String(v || '').toLowerCase().includes(s))
    }))
  }, [tasks, view, q, type, who, teamView])

  const grouped = useMemo(() => {
    const g = {}
    for (const t of filtered) (g[bucketOf(t)] ||= []).push(t)
    return g
  }, [filtered])

  const act = (fn, msg) => async (...a) => {
    try { await fn(...a); if (msg) toast(msg) }
    catch (e) { toast(e.message || 'Something went wrong') }
  }

  const save = async (data) => {
    try {
      if (editing) { await updateTask(editing.id, data); toast('Follow-up updated') }
      else { await addTask(data); toast('Follow-up added') }
      setAdding(false); setEditing(null)
    } catch (e) { toast(e.message || 'Could not save the follow-up') }
  }

  const stats = [
    { key: 'overdue', label: 'Overdue', value: taskSummary.overdue, tone: taskSummary.overdue ? 'bad' : '' },
    { key: 'today', label: 'Due today', value: taskSummary.today, tone: taskSummary.today ? 'warn' : '' },
    { key: 'week', label: 'Next 7 days', value: taskSummary.week },
    { key: 'doneToday', label: 'Cleared today', value: taskSummary.doneToday, tone: taskSummary.doneToday ? 'good' : '' },
  ]

  const bucketsToShow = view === 'Done' ? [{ key: 'done', label: 'Completed', tone: 'neutral' }] : BUCKETS

  return (
    <div className="fu">
      <PageHeader
        title="Follow-ups"
        subtitle={teamView
          ? "Everything your team owes a client — overdue first. Automated by your follow-up rules."
          : "Your work queue — overdue first. Unclaimed items are up for grabs."}
        actions={(
          <div className="row gap-xs">
            {canAutomate && (
              <Button variant="secondary" onClick={() => nav('/app/followups/rules')}>
                <Icon name="refresh" size={14} /> Automation
              </Button>
            )}
            <Button onClick={() => { setEditing(null); setAdding((a) => !a) }}>
              <Icon name="plus" size={14} /> New follow-up
            </Button>
          </div>
        )}
      />

      <div className="fu-stats">
        {stats.map((s) => (
          <div key={s.key} className={`fu-stat ${s.tone}`}>
            <div className="fu-stat-num">{s.value}</div>
            <div className="fu-stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {(adding || editing) && (
        <TaskForm
          initial={editing}
          users={users}
          canAssign={canAssign}
          currentUser={currentUser}
          onSave={save}
          onCancel={() => { setAdding(false); setEditing(null) }}
        />
      )}

      <div className="fu-toolbar">
        <PillSelect value={view} options={VIEWS} onChange={setView} />
        <ListSearch value={q} onChange={setQ} placeholder="Search follow-ups…" count={filtered.length} />
        <PillSelect value={type} options={['All types', ...TASK_TYPES.map((t) => t.label)]} onChange={setType} />
        {teamView && (
          <PillSelect
            value={who}
            options={['Everyone', 'Unclaimed', ...users.map((u) => u.name)]}
            onChange={setWho}
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="✓"
          title={view === 'Open' ? 'Nothing outstanding' : 'Nothing here'}
          sub={view === 'Open'
            ? 'Your queue is clear. New enquiries, sent quotes, bookings and unpaid invoices all add themselves here automatically.'
            : 'Try another view or clear the filters.'}
        />
      ) : (
        bucketsToShow.map((b) => {
          const rows = grouped[b.key] || []
          if (!rows.length) return null
          return (
            <div key={b.key} className="fu-group">
              <div className="fu-group-head">
                <span className={`fu-group-dot ${b.key}`} />
                <span className="fu-group-name">{b.label}</span>
                <span className="fu-group-count">{rows.length}</span>
              </div>
              <div className="fu-list">
                {rows.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    canSnooze={canSnooze}
                    onComplete={act(() => completeTask(t.id), 'Done — nice work')}
                    onReopen={act(() => reopenTask(t.id), 'Reopened')}
                    onSnooze={act((o) => snoozeTask(t.id, o), 'Snoozed')}
                    onEdit={() => { setAdding(false); setEditing(t) }}
                    onDelete={act(() => removeTask(t.id), 'Follow-up removed')}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
