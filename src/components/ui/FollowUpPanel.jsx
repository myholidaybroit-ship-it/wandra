import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext'
import { Button, Input, Select } from './UI'
import { Icon } from './icons'
import { TASK_TYPES, TYPE_META, bucketOf, dueLabel, presetDue, sortQueue } from '../../utils/followups'
import '../../pages/admin/tasks/followups.css'

/**
 * The follow-up panel that sits on a lead, quote, booking or invoice.
 * Same queue, filtered to one record — so the next action lives next to the
 * thing it's about instead of in a separate to-do app.
 *
 * Hidden entirely when the agency's plan or the user's role says no; the API
 * enforces the same two gates, this only keeps the UI honest.
 */
export default function FollowUpPanel({ kind, id, code, label, title = 'Follow-ups', compact = false }) {
  const {
    tasks, tasksFor, reloadTasks, addTask, completeTask, reopenTask,
    snoozeTask, removeTask, hasFeature, can, toast, currentUser,
  } = useApp()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState({ title: '', type: 'call', dueAt: presetDue('tomorrow') })
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const allowed = hasFeature('tasks.view') && hasFeature('tasks.linked') && can('tasks')
  const canSnooze = hasFeature('tasks.snooze')

  // the store loads the queue at bootstrap; refetch once if this panel mounts first
  useEffect(() => {
    if (!allowed || loaded || tasks.length) { setLoaded(true); return }
    reloadTasks().catch(() => {}).finally(() => setLoaded(true))
  }, [allowed, loaded, tasks.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    const list = tasksFor(kind, id)
    return sortQueue(list.filter((t) => t.status === 'open')).concat(
      list.filter((t) => t.status !== 'open').sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0)).slice(0, 3),
    )
  }, [tasks, kind, id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!allowed) return null

  const open = rows.filter((t) => t.status === 'open')
  const due = open.filter((t) => ['overdue', 'today'].includes(bucketOf(t))).length

  const save = async () => {
    const t = draft.title.trim()
    if (!t) return
    setSaving(true)
    try {
      await addTask({
        title: t,
        type: draft.type,
        dueAt: new Date(draft.dueAt).toISOString(),
        assigneeName: currentUser?.name || '',
        link: { kind, id, code: code || '', label: label || '' },
      })
      setDraft({ title: '', type: 'call', dueAt: presetDue('tomorrow') })
      setAdding(false)
      toast('Follow-up added')
    } catch (e) { toast(e.message || 'Could not add the follow-up') }
    finally { setSaving(false) }
  }

  const act = (fn, msg) => async () => {
    try { await fn(); toast(msg) } catch (e) { toast(e.message || 'Something went wrong') }
  }

  return (
    <div className="fup">
      <div className="fup-head">
        <Icon name="clock" size={15} />
        <span className="fup-title">{title}</span>
        <span className={`fup-count ${due ? 'due' : ''}`}>{open.length} open{due ? ` · ${due} due` : ''}</span>
        <div className="grow" style={{ flex: 1 }} />
        <Button size="sm" variant="secondary" onClick={() => setAdding((a) => !a)}>
          {adding ? 'Cancel' : <><Icon name="plus" size={13} /> Add</>}
        </Button>
      </div>

      {adding && (
        <div className="fup-quick">
          <Input
            autoFocus className="control" value={draft.title} maxLength={300}
            placeholder="What's the next action?"
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          <Select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))} style={{ width: 128 }}>
            {TASK_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </Select>
          <Input
            type="datetime-local" style={{ width: 190 }} value={draft.dueAt}
            onChange={(e) => setDraft((d) => ({ ...d, dueAt: e.target.value }))}
          />
          <Button size="sm" onClick={save} disabled={saving || !draft.title.trim()}>{saving ? 'Saving…' : 'Add'}</Button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="fup-empty">
          No follow-ups on this {kind === 'client' ? 'lead' : kind}. Add one so it can't slip.
        </div>
      ) : (
        rows.map((t) => {
          const bucket = bucketOf(t)
          const type = TYPE_META[t.type] || TYPE_META.other
          return (
            <div key={t.id} className={`fu-row ${bucket} ${t.status !== 'open' ? 'settled' : ''}`}>
              <button
                className="fu-check"
                title={t.status === 'open' ? 'Mark done' : 'Reopen'}
                onClick={t.status === 'open' ? act(() => completeTask(t.id), 'Done — nice work') : act(() => reopenTask(t.id), 'Reopened')}
              >
                {t.status === 'open' ? <span className="fu-check-box" /> : <Icon name="check" size={13} strokeWidth={3} />}
              </button>
              <span className={`fu-type ${t.priority}`} title={type.label}><Icon name={type.icon} size={13} /></span>
              <div className="fu-main">
                <div className="fu-title-row">
                  <span className="fu-title">{t.title}</span>
                  {t.auto && <span className="fu-auto" title="Scheduled by a follow-up rule">Auto</span>}
                </div>
                {!compact && t.notes && <div className="fu-notes">{t.notes}</div>}
                <div className="fu-meta">
                  <span className={`fu-due ${bucket}`}>{t.status === 'open' ? dueLabel(t) : `Done by ${t.completedByName || '—'}`}</span>
                  {t.assigneeName ? <span className="fu-who">{t.assigneeName}</span> : <span className="fu-who unclaimed">Unclaimed</span>}
                </div>
              </div>
              <div className="fu-actions">
                {t.status === 'open' && canSnooze && (
                  <button className="fu-mini" onClick={act(() => snoozeTask(t.id, { days: 1 }), 'Snoozed a day')}>+1d</button>
                )}
                <button className="fu-mini danger" title="Remove" onClick={act(() => removeTask(t.id), 'Follow-up removed')}>
                  <Icon name="trash" size={12} />
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
