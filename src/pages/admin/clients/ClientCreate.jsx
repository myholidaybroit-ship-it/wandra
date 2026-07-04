import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, AUTO_ASSIGNEE } from '../../../store/AppContext'
import { Card, Button, Field, Input, Textarea, PillSelect, PillMultiSelect, DatePicker, formatDate } from '../../../components/ui/UI'
import { Icon } from '../../../components/ui/icons'
import './query.css'

const SOURCES = ['Website', 'Ad Form', 'Referral', 'WhatsApp', 'Walk-in', 'B2B Agent', 'Instagram']
const SALUTATIONS = ['Mr.', 'Mrs.', 'Ms.', 'Dr.']
const PHONE_CODES = ['+91 IN', '+971 AE', '+1 US', '+44 UK']
const AGES = Array.from({ length: 17 }, (_, i) => String(i + 1))
const STEPS = [
  { n: 1, label: 'Source' },
  { n: 2, label: 'Trip' },
  { n: 3, label: 'Guest' },
  { n: 4, label: 'Review' },
]

function ReviewRow({ k, v }) {
  return <div className="kv"><span className="kv-k">{k}</span><span className="kv-v">{v || '—'}</span></div>
}

export default function ClientCreate() {
  const { addClient, destinations, users, toast } = useApp()
  const nav = useNavigate()
  const [step, setStep] = useState(1)

  const [f, setF] = useState({
    source: 'Website', refId: '', assignee: AUTO_ASSIGNEE,
    dests: [], startDate: '', nights: 1, adults: 2, children: 0, childAges: [],
    salutation: 'Mr.', name: '', email: '', city: '', comments: '',
    phones: [{ code: '+91 IN', number: '' }],
  })
  const [destScope, setDestScope] = useState('Domestic')
  const [phoneTouched, setPhoneTouched] = useState({})
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }))
  /* Country-aware rules: Indian numbers are exactly 10 digits */
  const phoneRule = (code) => ((code || '').startsWith('+91')
    ? { re: /^\d{10}$/, max: 10, placeholder: '10 digit number', err: 'Indian numbers must be exactly 10 digits.' }
    : { re: /^\d{8,15}$/, max: 15, placeholder: '8–15 digit number', err: 'Enter a valid number — 8 to 15 digits.' })
  const phoneValid = (p) => phoneRule(p.code).re.test(p.number)
  const phoneError = (i) => {
    const p = f.phones[i]
    if (!phoneTouched[i]) return false
    if (i === 0) return !phoneValid(p)
    return p.number.length > 0 && !phoneValid(p)
  }
  const phonesOk = () =>
    f.phones.length > 0 && phoneValid(f.phones[0]) &&
    f.phones.slice(1).every((p) => !p.number || phoneValid(p))
  const genRef = () => set('refId')(Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(0, 6).toUpperCase().padEnd(6, '7'))
  const setPhone = (i, patch) => setF((p) => ({ ...p, phones: p.phones.map((ph, x) => (x === i ? { ...ph, ...patch } : ph)) }))

  const setChildren = (raw) => {
    const n = Math.max(0, Math.min(10, Number(raw) || 0))
    setF((p) => ({
      ...p,
      children: n,
      childAges: Array.from({ length: n }, (_, i) => p.childAges[i] || ''),
    }))
  }
  const setAge = (i, v) => setF((p) => ({ ...p, childAges: p.childAges.map((a, x) => (x === i ? v : a)) }))

  const nights = Number(f.nights) || 0
  const paxLine = `${f.adults} ${Number(f.adults) === 1 ? 'Adult' : 'Adults'}${f.children > 0 ? ` · ${f.children} ${f.children === 1 ? 'Child' : 'Children'} (${f.childAges.filter(Boolean).map((a) => `${a} yrs`).join(', ') || 'ages pending'})` : ''}`

  const next = () => {
    if (step === 3) {
      if (!f.name.trim()) return toast('Guest name is required')
      if (!phonesOk()) {
        setPhoneTouched(Object.fromEntries(f.phones.map((_, i) => [i, true])))
        return toast('Enter a valid phone number — 10 to 15 digits')
      }
    }
    setStep((s) => Math.min(4, s + 1))
  }
  const back = () => setStep((s) => Math.max(1, s - 1))

  const save = () => {
    if (!f.name.trim()) { setStep(3); return toast('Guest name is required') }
    if (!phonesOk()) {
      setStep(3)
      setPhoneTouched(Object.fromEntries(f.phones.map((_, i) => [i, true])))
      return toast('Enter a valid phone number — 10 to 15 digits')
    }
    const rec = addClient({
      name: `${f.salutation} ${f.name.trim()}`,
      email: f.email,
      city: f.city.trim(),
      phone: f.phones.map((p) => p.number.trim()).filter(Boolean).join(', '),
      interest: f.dests.length ? f.dests.join(', ') : 'General Inquiry',
      source: f.source,
      note: f.comments || 'New Inquiry',
      budget: 0,
      query: {
        refId: f.refId, assignee: f.assignee,
        startDate: f.startDate, nights, adults: Number(f.adults) || 0,
        children: f.children, childAges: f.childAges.filter(Boolean),
      },
    })
    toast(rec.query?.assignee ? `Query captured — assigned to ${rec.query.assignee}` : 'Query captured — now build their package')
    nav(`/app/clients/${rec.id}/start`)
  }

  return (
    <div className="query-page">
      <Card pad={28}>
        {/* Stepper */}
        <div className="q-steps">
          {STEPS.map((s, i) => (
            <Fragment key={s.n}>
              <button
                className={`q-step ${step === s.n ? 'current' : ''} ${step > s.n ? 'done clickable' : ''}`}
                onClick={() => step > s.n && setStep(s.n)}
              >
                <span className="q-step-dot">{step > s.n ? <Icon name="check" size={13} strokeWidth={2.4} /> : s.n}</span>
                <span className="q-step-label">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <span className={`q-step-line ${step > s.n ? 'done' : ''}`} />}
            </Fragment>
          ))}
        </div>

        {/* Step 1 — Source */}
        {step === 1 && (
          <div className="q-panel">
            <div className="q-panel-title">Where did this query come from?</div>
            <div className="q-panel-sub">Source and ownership — so every lead is accounted for.</div>
            <div className="form-grid">
              <Field label="Query Source">
                <PillSelect value={f.source} options={SOURCES} onChange={set('source')} />
              </Field>
              <Field label="Sales Team" hint="Auto follows your assignment rules — round robin between matching members">
                <PillSelect value={f.assignee} options={[AUTO_ASSIGNEE, ...users.map((u) => u.name)]}
                  format={(v) => (v === AUTO_ASSIGNEE ? 'Auto — assignment rules' : v)} onChange={set('assignee')} />
              </Field>
              <Field label="Reference ID" hint="6 characters, for your own tracking — hit generate or type your own">
                <div className="input-action-row">
                  <Input value={f.refId} maxLength={6} onChange={(e) => set('refId')(e.target.value.toUpperCase())} placeholder="e.g. 4FQ9X2" />
                  <button className="btn-icon" title="Auto-generate" onClick={genRef}><Icon name="refresh" size={15} /></button>
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* Step 2 — Trip */}
        {step === 2 && (
          <div className="q-panel">
            <div className="q-panel-title">Where do they want to go?</div>
            <div className="q-panel-sub">Destinations, dates and travelers.</div>
            <div className="form-grid">
              <Field label="Destinations">
                <PillMultiSelect
                  value={f.dests}
                  options={destinations.filter((d) => (d.type || 'Domestic') === destScope).map((d) => d.name)}
                  onChange={set('dests')}
                  placeholder="Select destinations…"
                  searchable
                  searchPlaceholder="Search destinations…"
                  tabs={{ options: ['Domestic', 'International'], value: destScope, onChange: setDestScope }}
                />
              </Field>
              <Field label="Start Date">
                <DatePicker value={f.startDate} onChange={set('startDate')} placeholder="Pick a start date" />
              </Field>
            </div>
            <div className="form-grid-3 mt-md">
              <Field label="No. of Nights">
                <Input type="number" min="0" value={f.nights} onChange={(e) => set('nights')(e.target.value)} />
                <span className="q-hint">{nights} {nights === 1 ? 'Night' : 'Nights'}, {nights + 1} Days</span>
              </Field>
              <Field label="No. of Adults">
                <Input type="number" min="1" value={f.adults} onChange={(e) => set('adults')(e.target.value)} />
              </Field>
              <Field label="No. of Children">
                <Input type="number" min="0" max="10" value={f.children} onChange={(e) => setChildren(e.target.value)} />
              </Field>
            </div>
            {f.children > 0 && (
              <Field label="Children's Ages" full>
                <div className="q-ages">
                  {f.childAges.map((a, i) => (
                    <div className="q-age" key={i}>
                      <span className="q-age-label">Child {i + 1}</span>
                      <PillSelect value={a || 'Age'} options={AGES} onChange={(v) => setAge(i, v)} format={(v) => (v === 'Age' ? 'Age' : `${v} yrs`)} />
                    </div>
                  ))}
                </div>
              </Field>
            )}
          </div>
        )}

        {/* Step 3 — Guest */}
        {step === 3 && (
          <div className="q-panel">
            <div className="q-panel-title">Who is traveling?</div>
            <div className="q-panel-sub">The guest this trip belongs to.</div>
            <div className="q-guest-grid">
              <Field label="Salutation">
                <PillSelect value={f.salutation} options={SALUTATIONS} onChange={set('salutation')} />
              </Field>
              <Field label="Guest Name" required>
                <Input value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder="Full name" />
              </Field>
              <Field label="Email">
                <Input value={f.email} onChange={(e) => set('email')(e.target.value)} placeholder="name@email.com" />
              </Field>
              <Field label="City">
                <Input value={f.city} onChange={(e) => set('city')(e.target.value)} placeholder="e.g. Srinagar" />
              </Field>
            </div>
            <Field label="Phone Number(s)" full>
              <div>
                {f.phones.map((p, i) => (
                  <Fragment key={i}>
                    <div className="phone-row">
                      <PillSelect value={p.code} options={PHONE_CODES} onChange={(v) => setPhone(i, { code: v })} />
                      <div className="phone-input-wrap">
                        <Input
                          value={p.number}
                          maxLength={phoneRule(p.code).max}
                          inputMode="numeric"
                          className={phoneError(i) ? 'control-error' : ''}
                          onChange={(e) => setPhone(i, { number: e.target.value.replace(/\D/g, '').slice(0, phoneRule(p.code).max) })}
                          onBlur={() => setPhoneTouched((t) => ({ ...t, [i]: true }))}
                          placeholder={phoneRule(p.code).placeholder}
                        />
                        {phoneValid(p) && <span className="phone-ok"><Icon name="check" size={14} strokeWidth={2.4} /></span>}
                      </div>
                      {f.phones.length > 1 ? (
                        <button className="btn-icon" title="Remove" onClick={() => setF((prev) => ({ ...prev, phones: prev.phones.filter((_, x) => x !== i) }))}>✕</button>
                      ) : <span />}
                    </div>
                    {phoneError(i) && <div className="phone-err">{phoneRule(p.code).err}</div>}
                  </Fragment>
                ))}
                <span className="phone-add" onClick={() => setF((p) => ({ ...p, phones: [...p.phones, { code: '+91 IN', number: '' }] }))}>
                  + Add another phone
                </span>
              </div>
            </Field>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="q-panel">
            <div className="q-panel-title">Review & save</div>
            <div className="q-panel-sub">One last look — then it lands in your pipeline.</div>

            <div className="q-review-sec">
              <div className="q-review-head">
                <span className="t-caption-bold c-steel">SOURCE</span>
                <span className="q-review-edit" onClick={() => setStep(1)}>Edit</span>
              </div>
              <div className="q-review-grid">
                <ReviewRow k="Query Source" v={f.source} />
                <ReviewRow k="Sales Team" v={f.assignee === AUTO_ASSIGNEE ? 'Auto — assignment rules' : f.assignee} />
                <ReviewRow k="Reference ID" v={f.refId} />
              </div>
            </div>

            <div className="q-review-sec">
              <div className="q-review-head">
                <span className="t-caption-bold c-steel">TRIP</span>
                <span className="q-review-edit" onClick={() => setStep(2)}>Edit</span>
              </div>
              <div className="q-review-grid">
                <ReviewRow k="Destinations" v={f.dests.join(', ')} />
                <ReviewRow k="Start Date" v={formatDate(f.startDate)} />
                <ReviewRow k="Duration" v={`${nights} ${nights === 1 ? 'Night' : 'Nights'}, ${nights + 1} Days`} />
                <ReviewRow k="Travelers" v={paxLine} />
              </div>
            </div>

            <div className="q-review-sec">
              <div className="q-review-head">
                <span className="t-caption-bold c-steel">GUEST</span>
                <span className="q-review-edit" onClick={() => setStep(3)}>Edit</span>
              </div>
              <div className="q-review-grid">
                <ReviewRow k="Name" v={f.name ? `${f.salutation} ${f.name}` : ''} />
                <ReviewRow k="Email" v={f.email} />
                <ReviewRow k="City" v={f.city} />
                <ReviewRow k="Phone" v={f.phones.map((p) => p.number).filter(Boolean).join(', ')} />
              </div>
            </div>

            <Field label="Comments" hint="Preferences that help the sales process — optional" full>
              <Textarea rows={3} value={f.comments} onChange={(e) => set('comments')(e.target.value)} placeholder="e.g. Only 5-star hotels, vegetarian meals, honeymoon decor…" />
            </Field>
          </div>
        )}

        {/* Step navigation */}
        <div className="q-nav">
          <div>
            {step > 1
              ? <Button variant="tertiary" onClick={back}>← Back</Button>
              : <Button variant="tertiary" onClick={() => nav('/app/clients')}>Cancel</Button>}
          </div>
          <div className="q-nav-right">
            <span className="q-step-count">Step {step} of {STEPS.length}</span>
            {step < 4
              ? <Button onClick={next}>Continue →</Button>
              : <Button onClick={save}>Save Query</Button>}
          </div>
        </div>
      </Card>
    </div>
  )
}
