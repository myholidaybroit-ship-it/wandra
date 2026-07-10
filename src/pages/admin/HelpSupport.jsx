import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../store/AppContext'
import { api } from '../../api'
import { PageHeader, Card, Button, Field, Input, Select } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import './help.css'

const EMPTY_SUPPORT = {
  companyName: 'Support',
  email: '',
  phone: '',
  whatsapp: '',
  hours: '',
  description: 'We are one message away.',
}
const CATEGORIES = ['Technical issue', 'How-to question', 'Billing', 'Account access', 'Feature request', 'Other']

export default function HelpSupport() {
  const { currentUser, toast } = useApp()
  const [support, setSupport] = useState(EMPTY_SUPPORT)
  const [form, setForm] = useState({ subject: '', category: CATEGORIES[0], message: '', contactEmail: '', contactPhone: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    api.get('/support')
      .then((data) => setSupport({ ...EMPTY_SUPPORT, ...data }))
      .catch(() => toast('Support details could not be loaded'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => {
    setForm((current) => ({
      ...current,
      contactEmail: current.contactEmail || currentUser?.email || '',
      contactPhone: current.contactPhone || currentUser?.phone || '',
    }))
  }, [currentUser])

  const set = (key) => (e) => { setSent(false); setForm((current) => ({ ...current, [key]: e.target.value })) }
  const whatsappNumber = String(support.whatsapp || support.phone || '').replace(/\D/g, '')
  const whatsappHref = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hello ${support.companyName}, I need help with the CRM.`)}` : '#'
  const canSubmit = form.subject.trim() && form.message.trim() && !submitting
  const statusText = useMemo(() => sent ? 'Your inquiry was sent to the support team.' : '', [sent])

  const submit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await api.post('/support/inquiries', form)
      setForm((current) => ({ ...current, subject: '', message: '' }))
      setSent(true)
      toast('Support inquiry sent')
    } catch (error) {
      toast(error.message || 'Could not send your inquiry')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="support-page">
      <PageHeader title="Help & Support" subtitle={loading ? 'Loading support details…' : `Contact ${support.companyName} support.`} />

      <div className="support-hero-grid">
        <Card dark className="support-whatsapp-card">
          <div className="support-card-kicker"><span className="support-card-icon"><Icon name="help" size={16} /></span> Direct support</div>
          <div className="t-title-lg mt-base">Chat with {support.companyName}</div>
          <p className="t-body-sm mt-xs" style={{ color: 'var(--color-on-dark-soft)' }}>{support.description}</p>
          <Button as="a" href={whatsappHref} target="_blank" rel="noreferrer" className="mt-base" disabled={!whatsappNumber}>Open WhatsApp</Button>
        </Card>

        <Card className="support-reach-card">
          <div className="support-card-kicker"><span className="support-card-icon support-card-icon-light"><Icon name="help" size={16} /></span> Vendor support</div>
          <div className="t-title-md mt-base">Reach {support.companyName}</div>
          <hr className="divider" />
          <div className="support-detail-line"><span>Email</span><a href={support.email ? `mailto:${support.email}` : undefined}>{support.email || 'Not configured'}</a></div>
          <div className="support-detail-line"><span>Phone</span><a href={support.phone ? `tel:${support.phone}` : undefined}>{support.phone || 'Not configured'}</a></div>
          <div className="support-detail-line"><span>Hours</span><strong>{support.hours || 'Not configured'}</strong></div>
        </Card>
      </div>

      <div className="support-form-wrap">
        <Card className="support-contact-card">
          <div className="support-card-kicker"><span className="support-card-icon support-card-icon-light"><Icon name="file" size={16} /></span> Send an inquiry</div>
          <div className="t-title-lg mt-base">Tell us what you need</div>
          <p className="t-body-sm c-body mt-xs">Your message goes directly to the {support.companyName} operations team.</p>
          <form className="support-contact-form" onSubmit={submit}>
            <div className="form-grid">
              <Field label="Subject" required><Input value={form.subject} onChange={set('subject')} placeholder="What can we help with?" maxLength="160" required /></Field>
              <Field label="Category"><Select value={form.category} onChange={set('category')}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</Select></Field>
              <Field label="Your email"><Input type="email" value={form.contactEmail} onChange={set('contactEmail')} placeholder="you@agency.com" /></Field>
              <Field label="Your phone"><Input value={form.contactPhone} onChange={set('contactPhone')} placeholder="Optional" /></Field>
              <Field label="Message" required full><textarea className="control" rows="6" value={form.message} onChange={set('message')} placeholder="Describe the issue or question..." maxLength="5000" required /></Field>
            </div>
            <div className="support-submit-row"><div className={`support-success ${sent ? 'visible' : ''}`} role="status">{statusText}</div><Button type="submit" disabled={!canSubmit}>{submitting ? 'Sending…' : 'Send inquiry'}</Button></div>
          </form>
        </Card>
      </div>
    </div>
  )
}
