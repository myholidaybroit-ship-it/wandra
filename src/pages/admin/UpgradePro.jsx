import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp, inr } from '../../store/AppContext'
import { PageHeader, Button } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import './billing.css'

/* Manual activation: the agency pays Wandra, sends proof, we verify & switch them to Pro. */
const WANDRA_PAY = {
  accountName: 'ARUSOL TECHNOLOGIES PVT LTD',
  bankName: 'HDFC Bank',
  branch: 'Film Nagar',
  accountType: 'Current Account',
  accountNumber: '50200122592530',
  ifsc: 'HDFC0003974',
  whatsapp: '+91 90007 60096',
  email: 'billing@getwandra.com',
}

/* The staff roles an agency can staff up on — each seat is a paid user (₹999/user/mo). */
const SEAT_ROLES = [
  { key: 'sales', label: 'Sales', desc: 'Capture leads, build quotes & share packages' },
  { key: 'operations', label: 'Operations', desc: 'Bookings, vouchers & on-trip coordination' },
  { key: 'accounts', label: 'Accounts', desc: 'Invoices, payments & financial reports' },
  { key: 'travel', label: 'Travel Executives', desc: 'Own client trips end to end' },
]

const STEPS = [
  { title: 'Pay & send us the proof', body: 'Make the payment using the details alongside, then send the screenshot or UTR number on WhatsApp or email.' },
  { title: 'We verify your payment', body: 'Our team matches it against your agency — usually done within a few working hours.' },
  { title: 'Your plan switches to Pro', body: 'Everything unlocks on this account and we confirm the activation on WhatsApp & email.' },
]

export default function UpgradePro() {
  const { plans, agency, toast } = useApp()
  const pro = plans.find((p) => p.id === 'pro') || { price: 999 }
  const monthlyPrice = Number(pro.price) || 999
  const billedYearly = (pro.billingCycle || 'yearly') === 'yearly'

  const copy = (v, label) => { navigator.clipboard?.writeText(v); toast(`${label} copied`) }
  const waMsg = encodeURIComponent(`Hi Wandra! I've made the ${billedYearly ? 'yearly' : 'monthly'} payment for the Pro plan for ${agency.name}. Sharing the payment proof here.`)

  // ── team seat picker → builds a request the Wandra team provisions ──
  const [seats, setSeats] = useState({ sales: 1, operations: 0, accounts: 0, travel: 0 })
  const totalSeats = Object.values(seats).reduce((a, b) => a + b, 0)
  const seatMonthly = totalSeats * monthlyPrice
  const bump = (k, d) => setSeats((s) => ({ ...s, [k]: Math.max(0, s[k] + d) }))
  const seatBreakdown = SEAT_ROLES.filter((r) => seats[r.key] > 0).map((r) => `${r.label} × ${seats[r.key]}`).join(', ')
  const seatMsg = encodeURIComponent(
    `Hi Wandra! ${agency.name} would like ${totalSeats} user${totalSeats === 1 ? '' : 's'} (${seatBreakdown || 'to discuss seats'}) at ₹${monthlyPrice.toLocaleString('en-IN')}/user/month — about ₹${seatMonthly.toLocaleString('en-IN')}/month. Please set these up for us.`,
  )
  const sendSeatRequest = (channel) => {
    if (!totalSeats) return toast('Add at least one user to request')
    const url = channel === 'wa'
      ? `https://wa.me/${WANDRA_PAY.whatsapp.replace(/\D/g, '')}?text=${seatMsg}`
      : `mailto:${WANDRA_PAY.email}?subject=${encodeURIComponent(`User seats request — ${agency.name}`)}&body=${seatMsg}`
    window.open(url, '_blank')
    toast('Seat request ready — send it to us and we\'ll provision the users')
  }

  return (
    <div className="up">
      <PageHeader title="Upgrade to Pro" subtitle="Three quick steps — pay, we verify, and Pro goes live on your account." />

      <div className="up-grid">
        {/* ---------- the three steps ---------- */}
        <div className="up-steps">
          {STEPS.map((s, i) => (
            <div className="up-step" key={i}>
              <div className="up-step-rail">
                <span className="up-step-n">{i + 1}</span>
                {i < STEPS.length - 1 && <span className="up-step-line" />}
              </div>
              <div className="up-step-body">
                <div className="up-step-t">{s.title}</div>
                <p className="up-step-s">{s.body}</p>
                {i === 0 && (
                  <div className="up-contact">
                    <a className="up-contact-btn" target="_blank" rel="noreferrer"
                      href={`https://wa.me/${WANDRA_PAY.whatsapp.replace(/\D/g, '')}?text=${waMsg}`}>
                      WhatsApp {WANDRA_PAY.whatsapp}
                    </a>
                    <a className="up-contact-btn" href={`mailto:${WANDRA_PAY.email}?subject=${encodeURIComponent(`Pro upgrade payment proof — ${agency.name}`)}`}>
                      {WANDRA_PAY.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          <p className="lb-note">Pro is ₹{monthlyPrice.toLocaleString('en-IN')}/month, {billedYearly ? 'billed yearly' : 'billed monthly'}. Contact the Wandra team if you need help.</p>
        </div>

        {/* ---------- order summary + payment details ---------- */}
        <div className="up-side">
          {/* team seat picker */}
          <div className="up-card">
            <div className="up-card-title">How many users do you need?</div>
            <div className="up-seat-what">
              <Icon name="users" size={14} />
              <span>A <strong>user</strong> is a login for one team member — their own email, password and role. Each user is <strong>{inr(monthlyPrice)}/user/month</strong>, billed to your agency. The owner account counts as one user.</span>
            </div>
            <div className="up-seats">
              {SEAT_ROLES.map((r) => (
                <div className="up-seat-row" key={r.key}>
                  <div className="up-seat-info">
                    <span className="up-seat-label">{r.label}</span>
                    <span className="up-seat-desc">{r.desc}</span>
                  </div>
                  <div className="up-seat-step">
                    <button type="button" className="up-seat-btn" onClick={() => bump(r.key, -1)} disabled={seats[r.key] === 0} aria-label={`Remove ${r.label}`}>−</button>
                    <span className="up-seat-n">{seats[r.key]}</span>
                    <button type="button" className="up-seat-btn" onClick={() => bump(r.key, 1)} aria-label={`Add ${r.label}`}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="up-seat-total">
              <div><span className="up-seat-total-n">{totalSeats}</span> user{totalSeats === 1 ? '' : 's'}</div>
              <div className="up-seat-total-amt">{inr(seatMonthly)} <span>/ month</span></div>
            </div>
            <div className="up-contact up-seat-actions">
              <button type="button" className="up-contact-btn" onClick={() => sendSeatRequest('wa')}>Request on WhatsApp</button>
              <button type="button" className="up-contact-btn" onClick={() => sendSeatRequest('email')}>Request by email</button>
            </div>
          </div>

          <div className="up-card">
            <div className="up-card-title">Your order</div>
            <div className="up-line"><span>Wandra Pro</span><span>{inr(monthlyPrice)} / month</span></div>
            {billedYearly && <div className="up-line total"><span>Billing</span><span>Billed yearly</span></div>}
          </div>

          <div className="up-card">
            <div className="up-card-title">Pay to</div>
            {[
              ['Account name', WANDRA_PAY.accountName],
              ['Bank', WANDRA_PAY.bankName],
              ['Branch', WANDRA_PAY.branch],
              ['Account type', WANDRA_PAY.accountType],
              ['Account number', WANDRA_PAY.accountNumber],
              ['IFSC', WANDRA_PAY.ifsc],
            ].map(([k, v]) => (
              <button className="up-pay-row" key={k} title="Copy" onClick={() => copy(v, k)}>
                <span className="up-pay-k">{k}</span>
                <span className="up-pay-v">{v}</span>
                <Icon name="copy" size={12} />
              </button>
            ))}
            <div className="up-qr">
              <img src="/brand/payment-qr.jpg" alt="Scan to pay — UPI QR code" loading="lazy" />
              <span className="up-qr-caption">Or scan to pay via any UPI app</span>
            </div>
            <p className="up-pay-note">Tap any row to copy. Add your agency name — <strong>{agency.name}</strong> — in the payment note so we can match it faster.</p>
          </div>

          <Link to="/app/billing"><Button variant="tertiary" className="w-full">← Back to plans</Button></Link>
        </div>
      </div>
    </div>
  )
}
