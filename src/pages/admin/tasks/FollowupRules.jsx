import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../../store/AppContext'
import { PageHeader, Button, Input, EmptyState } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import { TYPE_META } from '../../../utils/followups'
import './followups.css'

/* The rules ship as a recommended set; this page is how an agency tunes the
   timing to the way they actually work. Everything here is enforced again on
   the server — the plan cap included. */

const STAGES = ['Leads', 'Quotes', 'Bookings', 'Trips', 'Invoices']

/* Offsets are stored in DAYS and signed (negative = before the anchor), but a
   field labelled "days before the travel date" must never also show "-10".
   These two convert between the stored value and what the box shows. */
const toDisplay = (rule, offset) => {
  const n = Math.abs(Number(offset) || 0)
  return rule.unit === 'hours' ? Math.round(n * 24) : Number(n.toFixed(2))
}
const toStored = (rule, shown) => {
  const n = Math.abs(Number(shown) || 0)
  const days = rule.unit === 'hours' ? n / 24 : n
  return rule.direction === 'before' ? -days : days
}
const unitLabel = (rule, shown) => {
  const one = Math.abs(shown) === 1
  return rule.unit === 'hours' ? `hour${one ? '' : 's'} ${rule.direction}` : `day${one ? '' : 's'} ${rule.direction}`
}

/** "Runs 4 hours after the lead arriving." → a plain-English recap. */
function offsetLabel(rule, offset) {
  const shown = toDisplay(rule, offset)
  if (shown === 0) return `as soon as ${rule.anchor} happens`
  return `${shown} ${unitLabel(rule, shown)} ${rule.anchor}`
}

/* same switch the Landing Builder, Policies and Assignment pages use */
function Toggle({ on, disabled, onChange, title }) {
  return (
    <label className={`lb-switch fr-switch ${disabled ? 'is-disabled' : ''}`} title={title}>
      <input type="checkbox" checked={on} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="lb-switch-track"><span className="lb-switch-thumb" /></span>
    </label>
  )
}

export default function FollowupRules() {
  const { followupRules, loadFollowupRules, hasFeature, toast } = useApp()
  const nav = useNavigate()
  const [busy, setBusy] = useState('')
  const [drafts, setDrafts] = useState({})
  const { setFollowupRule } = useApp()

  useEffect(() => { loadFollowupRules().catch((e) => toast(e.message || 'Could not load your rules')) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!hasFeature('tasks.automation')) {
    return (
      <div className="fr">
        <PageHeader title="Follow-up automation" subtitle="Let Wandra schedule the next action at every stage of a trip." />
        <EmptyState icon="🔒" title="Not on your plan"
          sub="Automated follow-up rules are a Pro feature. Your team can still add follow-ups by hand from the Follow-ups page." />
        <div className="row center mt-lg"><Button as="a" href="/app/billing">View plan &amp; billing</Button></div>
      </div>
    )
  }
  if (!followupRules) return <div className="fr"><PageHeader title="Follow-up automation" /><p className="t-body-sm c-muted">Loading…</p></div>

  const { catalog, rules, active, limit } = followupRules
  const atCap = limit !== -1 && active >= limit
  const strandedCount = Object.values(rules).filter((r) => r.cappedOut).length

  const change = async (key, patch) => {
    setBusy(key)
    try { await setFollowupRule(key, patch); toast('Automation updated') }
    catch (e) { toast(e.message || 'Could not update the rule') }
    finally { setBusy('') }
  }

  const commitOffset = (rule, raw, currentOffset) => {
    setDrafts((d) => { const { [rule.key]: _drop, ...rest } = d; return rest })
    if (raw === '' || !Number.isFinite(Number(raw))) return
    const next = toStored(rule, raw)
    if (Math.abs(next - currentOffset) < 1e-6) return
    change(rule.key, { offset: next })
  }

  return (
    <div className="fr">
      <PageHeader
        title="Follow-up automation"
        subtitle="Wandra schedules the next action itself, so nothing depends on someone remembering."
        actions={<Button variant="secondary" onClick={() => nav('/app/followups')}>Back to follow-ups</Button>}
      />

      <div className={`fr-banner ${strandedCount ? 'warn' : ''}`}>
        <span className="fr-banner-ic"><Icon name="refresh" size={15} /></span>
        <p>
          <strong>{active} rule{active === 1 ? '' : 's'} running</strong>
          {limit === -1 ? ' — unlimited on your plan.' : ` of ${limit} allowed on your plan.`}
          {' '}Each one drops a dated follow-up on the right person's queue the moment a trip reaches that stage.
          Existing follow-ups keep their dates when you change a rule — only new ones use the new timing.
          {strandedCount > 0 && (
            <> <strong>{strandedCount} rule{strandedCount === 1 ? ' is' : 's are'} switched on but not running</strong> because
            the allowance is full — turn others off to choose which ones count, or upgrade.</>
          )}
        </p>
      </div>

      {STAGES.map((stage) => {
        const items = catalog.filter((c) => c.stage === stage)
        if (!items.length) return null
        return (
          <div key={stage} className="fr-stage">
            <div className="fr-stage-head">{stage}</div>
            <div className="fr-card">
              {items.map((c) => {
                const cfg = rules[c.key] || { enabled: false, offset: c.defaultOffset }
                const locked = !c.available
                // ticked but not running, because the plan's rule allowance is full
                const cappedOut = !!cfg.cappedOut
                const blocked = !cfg.enabled && atCap
                const draft = drafts[c.key]
                const type = TYPE_META[c.type] || TYPE_META.other
                return (
                  <div key={c.key} className={`fr-row ${locked ? 'locked' : cappedOut ? 'capped' : cfg.enabled ? '' : 'off'}`}>
                    <span className={`fu-type ${c.priority}`}><Icon name={type.icon} size={14} /></span>
                    <div className="fr-row-main">
                      <div className="fr-row-name">
                        {c.label}
                        <span className="fr-tag">{type.label}</span>
                        {c.priority === 'high' && <span className="fu-flag">High</span>}
                        {locked && <span className="fr-tag">needs {c.feature}</span>}
                        {cappedOut && <span className="fr-tag over">over your limit</span>}
                      </div>
                      <div className="fr-row-desc">
                        {c.desc}{' '}
                        {cappedOut
                          ? <strong>Switched on, but not running — your plan's rule allowance is full.</strong>
                          : cfg.enabled && !locked && <strong>Runs {offsetLabel(c, cfg.offset)}.</strong>}
                      </div>
                    </div>

                    <div className="fr-offset">
                      <Input
                        type="number" step="1" min="0" max={c.unit === 'hours' ? 720 : 365}
                        disabled={locked || !cfg.enabled || busy === c.key}
                        value={draft ?? toDisplay(c, cfg.offset)}
                        onChange={(e) => setDrafts((d) => ({ ...d, [c.key]: e.target.value }))}
                        onBlur={(e) => commitOffset(c, e.target.value, cfg.offset)}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                      />
                      <span className="fr-offset-lbl">
                        {unitLabel(c, Number(draft ?? toDisplay(c, cfg.offset)))} {c.anchor}
                      </span>
                    </div>

                    <Toggle
                      on={cfg.enabled && !locked}
                      disabled={locked || busy === c.key || blocked}
                      title={locked ? `Needs the ${c.feature} feature` : cappedOut ? "Switched on, but over your plan's rule allowance" : blocked ? 'Plan limit reached — switch another rule off first' : undefined}
                      onChange={(v) => change(c.key, { enabled: v })}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {atCap && (
        <div className="fr-banner">
          <span className="fr-banner-ic"><Icon name="billing" size={15} /></span>
          <p>
            You're using every automated rule your plan allows ({limit}). Switch one off to make room, or{' '}
            <a href="/app/billing">upgrade</a> for unlimited automation.
          </p>
        </div>
      )}
    </div>
  )
}
