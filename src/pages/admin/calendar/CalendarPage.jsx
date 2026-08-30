import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, inr } from '../../../store/AppContext'
import { PageHeader, Button, Card } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './calendar.css'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayIso = () => iso(new Date())

/**
 * The agency's month at a glance — trips departing, instalments falling due
 * and follow-up reminders, all on one calendar.
 */
export default function CalendarPage() {
  const { bookings, tasks, canSeePricing } = useApp()
  const nav = useNavigate()
  const now = new Date()
  const [period, setPeriod] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const move = (n) => setPeriod((p) => { const d = new Date(p.y, p.m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } })

  // every dated event, grouped by ISO day
  const events = useMemo(() => {
    const map = {}
    const add = (day, ev) => { if (day) (map[day] = map[day] || []).push(ev) }
    bookings.filter((b) => b.status !== 'Cancelled').forEach((b) => {
      add(b.travelDate, { kind: 'trip', label: `✈ ${b.clientName}`, sub: b.code, to: `/app/bookings/${b.id}` })
      ;(b.schedule || []).forEach((r) => {
        if (r.status !== 'Paid' && r.dueDate) {
          add(r.dueDate, {
            kind: 'due', to: `/app/bookings/${b.id}`, sub: b.code,
            label: `${canSeePricing ? inr(Number(r.amount) || 0) + ' ' : ''}${r.label || 'instalment'} · ${b.clientName}`,
            overdue: r.dueDate < todayIso(),
          })
        }
      })
    })
    tasks.filter((t) => t.status !== 'Done' && t.dueAt).forEach((t) => {
      add(iso(new Date(t.dueAt)), { kind: 'task', label: `⏰ ${t.title}`, sub: t.link?.code || '', to: '/app/followups', overdue: new Date(t.dueAt) < new Date() })
    })
    Object.values(map).forEach((l) => l.sort((a, b) => (a.kind > b.kind ? 1 : -1)))
    return map
  }, [bookings, tasks, canSeePricing])

  // 6-row month grid, weeks starting Monday
  const cells = useMemo(() => {
    const first = new Date(period.y, period.m, 1)
    const lead = (first.getDay() + 6) % 7
    const start = new Date(period.y, period.m, 1 - lead)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
      return { date: d, key: iso(d), inMonth: d.getMonth() === period.m }
    })
  }, [period])

  const monthName = new Date(period.y, period.m, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  // the next 14 days of everything, as a simple list
  const upcoming = useMemo(() => {
    const from = todayIso()
    const to = iso(new Date(Date.now() + 14 * 86400000))
    return Object.entries(events)
      .filter(([day]) => day >= from && day <= to)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([day, list]) => list.map((ev) => ({ ...ev, day })))
      .slice(0, 12)
  }, [events])

  return (
    <div className="cal">
      <PageHeader title="Calendar" subtitle="Trips coming up, payments falling due and reminders — the month at a glance." />

      <div className="cal-grid-wrap">
        <Card pad={0} className="cal-card">
          <div className="cal-head">
            <div className="cal-month">{monthName}</div>
            <div className="row gap-xs">
              <button className="cal-nav" onClick={() => move(-1)}>‹</button>
              <Button variant="secondary" size="sm" onClick={() => setPeriod({ y: now.getFullYear(), m: now.getMonth() })}>Today</Button>
              <button className="cal-nav" onClick={() => move(1)}>›</button>
            </div>
          </div>
          <div className="cal-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
          <div className="cal-grid">
            {cells.map((c) => {
              const evs = events[c.key] || []
              const isToday = c.key === todayIso()
              return (
                <div key={c.key} className={`cal-cell ${c.inMonth ? '' : 'dim'} ${isToday ? 'today' : ''}`}>
                  <span className="cal-daynum">{c.date.getDate()}</span>
                  <div className="cal-evs">
                    {evs.slice(0, 3).map((ev, i) => (
                      <button key={i} className={`cal-ev ${ev.kind} ${ev.overdue ? 'overdue' : ''}`} title={`${ev.label}${ev.sub ? ` · ${ev.sub}` : ''}`} onClick={() => nav(ev.to)}>
                        {ev.label}
                      </button>
                    ))}
                    {evs.length > 3 && <span className="cal-more">+{evs.length - 3} more</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="cal-legend">
            <span><i className="lg trip" /> Trip departure</span>
            <span><i className="lg due" /> Payment due</span>
            <span><i className="lg task" /> Follow-up / reminder</span>
          </div>
        </Card>

        <Card className="cal-side">
          <div className="t-title-md">Next 14 days</div>
          <hr className="divider" />
          {upcoming.length === 0 && <p className="t-body-sm c-steel">Nothing scheduled in the next two weeks.</p>}
          <div className="cal-up-list">
            {upcoming.map((ev, i) => (
              <button key={i} className="cal-up" onClick={() => nav(ev.to)}>
                <span className="cal-up-date">{new Date(ev.day + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                <span className={`cal-up-dot ${ev.kind}`} />
                <span className="cal-up-body">
                  <span className="cal-up-label">{ev.label}</span>
                  {ev.sub && <span className="cal-up-sub mono">{ev.sub}</span>}
                </span>
                <Icon name="chevron" size={13} />
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
