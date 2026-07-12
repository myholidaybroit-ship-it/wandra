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
  whatsapp: '+91 79066 22111',
  email: 'billing@wandra.travel',
}

const STEPS = [
  { title: 'Pay & send us the proof', body: 'Make the payment using the details alongside, then send the screenshot or UTR number on WhatsApp or email — or simply call us.' },
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
                    <a className="up-contact-btn" href={`tel:${WANDRA_PAY.whatsapp.replace(/\s/g, '')}`}>Call us</a>
                  </div>
                )}
              </div>
            </div>
          ))}
          <p className="lb-note">Pro is ₹{monthlyPrice.toLocaleString('en-IN')}/month, {billedYearly ? 'billed yearly' : 'billed monthly'}. Contact the Wandra team if you need help.</p>
        </div>

        {/* ---------- order summary + payment details ---------- */}
        <div className="up-side">
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
