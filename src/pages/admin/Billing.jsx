import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, inr } from '../../store/AppContext'
import { PageHeader, Button } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import './billing.css'

export default function Billing() {
  const { plans, agency, clients, toast } = useApp()
  const nav = useNavigate()
  const [cycle, setCycle] = useState('yearly') // 'monthly' | 'yearly'
  const free = plans.find((p) => p.id === 'free')
  const pro = plans.find((p) => p.id === 'pro')
  const used = clients.length
  const limit = agency.plan.limit
  const yearly = cycle === 'yearly'

  return (
    <div className="bl">
      <PageHeader title="Billing & Subscription" subtitle="Two simple plans — start free, upgrade when you're growing. No credits, no surprises." />

      {/* current plan strip */}
      <div className="bl-current">
        <div className="bl-cur-left">
          <span className="bl-cur-k">Current plan</span>
          <span className="bl-cur-name">{agency.plan.name}</span>
        </div>
        <div className="bl-cur-usage">
          <span className="bl-cur-count"><strong>{used}</strong> / {limit} clients used</span>
          <span className="bl-cur-track"><span className="bl-cur-bar" style={{ width: `${Math.min(100, (used / limit) * 100)}%` }} /></span>
        </div>
        <span className="bl-offer">Launch offer · 70% off</span>
      </div>

      {/* billing cycle */}
      <div className="bl-cycle">
        <div className="qs-toggle">
          <button className={`qs-pill ${!yearly ? 'on' : ''}`} onClick={() => setCycle('monthly')}>Monthly</button>
          <button className={`qs-pill ${yearly ? 'on' : ''}`} onClick={() => setCycle('yearly')}>Yearly</button>
        </div>
        <span className="bl-cycle-save">Save 33% on yearly</span>
      </div>

      {/* the two plans */}
      <div className="bl-grid">
        <div className="bl-card">
          <div className="bl-name">{free.name}</div>
          <div className="bl-price-row">
            <span className="bl-price">Free</span>
            <span className="bl-per">forever</span>
          </div>
          <p className="bl-tagline">{free.tagline}</p>
          <hr className="bl-rule" />
          <ul className="bl-perks">
            {free.perks.map((x) => (
              <li key={x}><span className="bl-tick"><Icon name="check" size={11} strokeWidth={3} /></span>{x}</li>
            ))}
          </ul>
          <Button variant="secondary" className="w-full bl-cta" onClick={() => toast('You are already on the Free plan')}>Current plan</Button>
        </div>

        <div className="bl-card pro">
          <span className="bl-pop">Most popular</span>
          <div className="bl-name">{pro.name}</div>
          <div className="bl-price-row">
            <span className="bl-old">{inr(yearly ? pro.price : pro.oldPrice)}</span>
            <span className="bl-price">{inr(yearly ? pro.priceYear : pro.price)}</span>
            <span className="bl-per">/ month{yearly ? ' · billed yearly' : ''}</span>
          </div>
          {yearly && <div className="bl-year-note">{inr(pro.priceYear * 12)} once a year — 33% less than monthly</div>}
          <p className="bl-tagline">{pro.tagline}</p>
          <hr className="bl-rule" />
          <div className="bl-plus">{pro.plus}</div>
          <ul className="bl-perks">
            {pro.perks.map((x) => (
              <li key={x}><span className="bl-tick"><Icon name="check" size={11} strokeWidth={3} /></span>{x}</li>
            ))}
          </ul>
          <button className="bl-cta-pro" onClick={() => nav(`/app/upgrade?cycle=${cycle}`)}>Upgrade to Pro</button>
        </div>
      </div>

      {/* custom needs — a conversation, not a third plan */}
      <div className="bl-custom">
        <div>
          <span className="bl-custom-t">Need something custom?</span>
          <p className="bl-custom-s">Multiple branches, white-label or API access — we'll tailor Pro around your agency.</p>
        </div>
        <Button variant="secondary" onClick={() => toast(`We'll reach out — or write to hello@wandra.travel`)}>Talk to us</Button>
      </div>
    </div>
  )
}
