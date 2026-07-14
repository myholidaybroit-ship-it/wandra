import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, inr } from '../../store/AppContext'
import { PageHeader, Button, Modal, Field, Input, Textarea } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import './billing.css'

/* Fallback plan cards — used only if the backend config hasn't returned plans yet
   (empty Plan collection / older backend), so this page never shows a blank gap. */
const FALLBACK_FREE = {
  id: 'free', name: 'Free', price: 0, period: 'forever',
  tagline: 'Everything you need to start selling trips.',
  perks: ['Up to 100 clients', 'Quote builder with markup pricing', 'Itineraries, quotations & PDF downloads', 'WhatsApp & email sharing', 'Basic reports', 'Email support'],
}
const FALLBACK_PRO = {
  id: 'pro', name: 'Pro', price: 999, period: 'mo', billingCycle: 'yearly', annualDiscountPercent: 0, annualTotal: 11988,
  tagline: 'The complete engine for a growing agency.', plus: 'Everything in Free, plus:',
  perks: ['Unlimited clients & enquiries', 'Bookings, invoices & payment tracking', 'Vouchers — hotel, transport & activity', 'Lead-capture landing page', 'Auto lead assignment (round robin)', 'In-depth reports with Excel / CSV export', 'Team accounts with roles & permissions', 'Your branding on every document', 'Priority WhatsApp support'],
}

export default function Billing() {
  const { plans, agency, clients, packages, users, limitFor, toast } = useApp()
  const nav = useNavigate()

  // ── live plan usage (reflects the admin-set caps) ──
  const now = new Date()
  const pkgsThisMonth = (packages || []).filter((p) => {
    const d = p.createdAt ? new Date(p.createdAt) : null
    return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  }).length
  const USAGE = [
    { key: 'clients', label: 'Clients / leads', used: clients.length, suffix: '' },
    { key: 'packages', label: 'Packages / quotes', used: pkgsThisMonth, suffix: ' this month' },
    { key: 'team', label: 'Team members', used: (users || []).length, suffix: ' seats' },
    { key: 'storage', label: 'Cloud storage', used: null, suffix: ' MB', unitLabel: 'MB' },
  ]
  const [talk, setTalk] = useState(false)
  const [msg, setMsg] = useState({ name: '', email: '', message: '' })
  const openTalk = () => { setMsg({ name: agency.name, email: agency.email, message: '' }); setTalk(true) }
  const sendTalk = () => {
    if (!msg.message.trim()) return toast('Tell us a little about what you need')
    setTalk(false)
    toast(`Message sent — we'll reply to ${msg.email} within a working day`)
  }
  const byId = (id) => plans.find((p) => (p.id || p.key || p.name || '').toLowerCase() === id)
  const free = byId('free') || FALLBACK_FREE
  const pro = byId('pro') || FALLBACK_PRO
  const isPro = (agency?.plan?.name || '').toLowerCase() === 'pro'
  const used = clients.length
  const unlimited = agency?.plan?.limit === -1
  const limit = unlimited ? '∞' : (agency?.plan?.limit ?? 0)
  const usedPct = unlimited || !agency?.plan?.limit ? 0 : Math.min(100, (used / agency.plan.limit) * 100)
  return (
    <div className="bl">
      <PageHeader title="Billing & Subscription" subtitle={isPro
        ? "You're on Pro — the complete engine for a growing agency."
        : "Two simple plans — start free, upgrade when you're growing. No credits, no surprises."} />

      {/* current plan strip */}
      <div className="bl-current">
        <div className="bl-cur-left">
          <span className="bl-cur-k">Current plan</span>
          <span className="bl-cur-name">{agency?.plan?.name || '—'}</span>
        </div>
        <div className="bl-cur-usage">
          <span className="bl-cur-count"><strong>{used}</strong> / {limit} clients used</span>
          <span className="bl-cur-track"><span className="bl-cur-bar" style={{ width: `${usedPct}%` }} /></span>
        </div>
        {isPro
          ? <span className="bl-offer" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>Active subscription</span>
          : null}
      </div>

      {/* ---------- live plan usage — mirrors the caps set for this agency ---------- */}
      <div className="bl-usage">
        <div className="bl-usage-title">Plan usage</div>
        <div className="bl-usage-grid">
          {USAGE.map((u) => {
            const cap = limitFor(u.key)
            const unlimited = cap === -1 || cap == null
            const pct = unlimited || !cap ? 0 : Math.min(100, ((u.used ?? 0) / cap) * 100)
            const over = !unlimited && u.used != null && u.used > cap
            return (
              <div className="bl-usage-item" key={u.key}>
                <div className="bl-usage-row">
                  <span className="bl-usage-label">{u.label}</span>
                  <span className={`bl-usage-count ${over ? 'over' : ''}`}>
                    {u.used == null
                      ? (unlimited ? 'Unlimited' : `${cap}${u.suffix}`)
                      : <>{u.used}{unlimited ? '' : ` / ${cap}`}{u.suffix}</>}
                  </span>
                </div>
                {u.used != null && (
                  <span className="bl-usage-track"><span className="bl-usage-bar" style={{ width: `${unlimited ? 6 : pct}%` }} /></span>
                )}
              </div>
            )
          })}
        </div>
        <p className="bl-usage-note">Destinations, hotels &amp; cab types are unlimited on every plan. Team seats are ₹999 / user / month.</p>
      </div>

      {/* Pro members don't get an upgrade push — just their status + support */}
      {isPro ? (
        <div className="bl-custom" style={{ marginTop: 18 }}>
          <div>
            <span className="bl-custom-t">You're all set on Pro</span>
            <p className="bl-custom-s">Every Wandra feature is unlocked for your agency. Manage your subscription or renewal with the Wandra team anytime.</p>
          </div>
          <Button variant="secondary" onClick={openTalk}>Contact billing</Button>
        </div>
      ) : (
        <>
          {/* the two plans */}
          {free && pro && (
          <div className="bl-grid">
            <div className="bl-card">
              <div className="bl-name">{free.name}</div>
              <div className="bl-price-row">
                <span className="bl-price">{free.price === 0 ? 'Free' : inr(free.price)}</span>
                <span className="bl-per">{free.price === 0 ? 'forever' : '/ month'}</span>
              </div>
              <p className="bl-tagline">{free.tagline}</p>
              <hr className="bl-rule" />
              <ul className="bl-perks">
                {(free.perks || []).map((x) => (
                  <li key={x}><span className="bl-tick"><Icon name="check" size={11} strokeWidth={3} /></span>{x}</li>
                ))}
              </ul>
              <Button variant="secondary" className="w-full bl-cta" onClick={() => toast('You are already on the Free plan')}>Current plan</Button>
            </div>

            <div className="bl-card pro">
              <span className="bl-pop">Most popular</span>
              <div className="bl-name">{pro.name}</div>
              <div className="bl-price-row">
                <span className="bl-price">{inr(pro.price)}</span>
                <span className="bl-per">/ month</span>
              </div>
              {(pro.billingCycle === 'yearly' || pro.annualTotal) && (
                <div className="bl-billed-yearly">Billed yearly</div>
              )}
              <p className="bl-tagline">{pro.tagline}</p>
              <hr className="bl-rule" />
              <div className="bl-plus">{pro.plus}</div>
              <ul className="bl-perks">
                {(pro.perks || []).map((x) => (
                  <li key={x}><span className="bl-tick"><Icon name="check" size={11} strokeWidth={3} /></span>{x}</li>
                ))}
              </ul>
              <button className="bl-cta-pro" onClick={() => nav('/app/upgrade')}>Upgrade to Pro</button>
            </div>
          </div>
          )}
        </>
      )}

      {/* billing message — name & email prefilled from the agency profile */}
      <Modal open={talk} onClose={() => setTalk(false)} title="Talk to us" width={500}
        footer={<><Button variant="tertiary" onClick={() => setTalk(false)}>Cancel</Button><Button onClick={sendTalk}>Send Message</Button></>}>
        <div className="col gap-base">
          <div className="form-grid">
            <Field label="Name"><Input value={msg.name} onChange={(e) => setMsg({ ...msg, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" value={msg.email} onChange={(e) => setMsg({ ...msg, email: e.target.value })} /></Field>
          </div>
          <Field label="Message" hint="What do you need — branches, white-label, API access, volume pricing?">
            <Textarea rows={4} autoFocus value={msg.message} onChange={(e) => setMsg({ ...msg, message: e.target.value })}
              placeholder="e.g. We run 3 branches and need separate teams with one billing…" />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
