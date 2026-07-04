import { useRef, useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHeader, Button } from '../../components/ui/UI'
import { Icon } from '../../components/ui/icons'
import { LandingRender, LandingFooter } from '../public/BizLanding'
import { ImageInput } from '../../components/ui/ImageInput'
import './landing-builder.css'

const ACCENTS = ['#111113', '#f84f39', '#e93d82', '#2d55fb', '#7c3aed', '#0e7490', '#15803d', '#ab6400']
const SECTION_META = {
  hero: { name: 'Hero', desc: 'Big opening — headline, photo & call-to-action' },
  about: { name: 'About us', desc: 'Who you are and why travellers should trust you' },
  form: { name: 'Enquiry form', desc: 'Captures leads straight into Trips & Clients' },
}
const FORM_FIELDS = [
  ['adults', 'No. of Adults'], ['children', 'Children'], ['email', 'Email'],
  ['destination', 'Destination'], ['startDate', 'Start Date'], ['days', 'No. of Days'], ['comments', 'Requirements / Comments'],
]

export default function LandingBuilder() {
  const { landing, updateLanding, agency, toast } = useApp()
  const [openSec, setOpenSec] = useState('hero')
  const dragIdx = useRef(null)
  const [overIdx, setOverIdx] = useState(null)

  const patch = (key, p) => updateLanding({ [key]: { ...landing[key], ...p } })
  const url = `${window.location.origin}/site/${landing.slug}`
  const copy = () => { navigator.clipboard?.writeText(url); toast('Landing page link copied') }

  /* ---------- drag & drop section reorder ---------- */
  const onDrop = (i) => {
    const from = dragIdx.current
    if (from == null || from === i) { setOverIdx(null); return }
    const order = [...landing.order]
    const [moved] = order.splice(from, 1)
    order.splice(i, 0, moved)
    updateLanding({ order })
    dragIdx.current = null; setOverIdx(null)
    toast('Sections reordered')
  }

  const formRef = useRef(null)
  const previewSubmit = () => toast('Preview only — the form is live on your public page')

  return (
    <div className="lb">
      <PageHeader title="Landing Page" subtitle="Your lead-capture site — every enquiry lands in Trips & Clients automatically."
        actions={<>
          <button className={`lb-publish ${landing.published ? 'on' : ''}`} onClick={() => updateLanding({ published: !landing.published })}>
            <span className="lb-publish-dot" />{landing.published ? 'Live' : 'Unpublished'}
          </button>
          <Button variant="secondary" onClick={copy}><Icon name="copy" size={14} /> Copy link</Button>
          <a href={url} target="_blank" rel="noreferrer"><Button>Open ↗</Button></a>
        </>} />

      <div className="lb-grid">
        {/* ================= Editor ================= */}
        <div className="lb-editor">
          {/* Brand / global */}
          <div className="lb-card">
            <div className="lb-card-title">Brand</div>
            <div className="lb-field">
              <span className="lb-k">Accent colour</span>
              <div className="lb-swatches">
                {ACCENTS.map((c) => (
                  <button key={c} className={`lb-swatch ${landing.accent === c ? 'on' : ''}`} style={{ background: c }}
                    onClick={() => updateLanding({ accent: c })} aria-label={c} />
                ))}
                <label className="lb-swatch-custom" title="Custom colour">
                  <input type="color" value={landing.accent} onChange={(e) => updateLanding({ accent: e.target.value })} />
                  <span style={{ background: landing.accent }} />
                </label>
              </div>
            </div>
            <div className="lb-field">
              <span className="lb-k">Page address</span>
              <div className="lb-slug">
                <span className="lb-slug-pre">/site/</span>
                <input value={landing.slug} onChange={(e) => updateLanding({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
              </div>
            </div>
          </div>

          {/* Header — fixed on top, not reorderable */}
          <div className="lb-sec">
            <div className="lb-sec-head" onClick={() => setOpenSec(openSec === 'header' ? '' : 'header')}>
              <span className="lb-drag fixed" title="Header always sits on top">▤</span>
              <div className="lb-sec-meta">
                <span className="lb-sec-name">Header</span>
                <span className="lb-sec-desc">Logo, business name & enquiry button — always on top</span>
              </div>
              <label className="lb-switch" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={landing.header?.enabled !== false} onChange={(e) => patch('header', { enabled: e.target.checked })} />
                <span className="lb-switch-track"><span className="lb-switch-thumb" /></span>
              </label>
              <span className={`lb-chev ${openSec === 'header' ? 'up' : ''}`}><Icon name="chevron" size={14} /></span>
            </div>
            {openSec === 'header' && (
              <div className="lb-sec-body">
                <ImageInput label="Logo" value={landing.header?.logo} maxW={400}
                  onChange={(v) => patch('header', { logo: v })} hint="PNG with transparency looks best" />
                <div className="lb-two">
                  <Lbi label="Business name" v={landing.header?.name} on={(v) => patch('header', { name: v })} />
                  <Lbi label="Button text" v={landing.header?.ctaText} on={(v) => patch('header', { ctaText: v })} />
                </div>
              </div>
            )}
          </div>

          {/* Sections — drag to reorder */}
          <div className="lb-hint"><Icon name="panel" size={13} /> Drag sections to reorder · click to edit</div>
          {landing.order.map((key, i) => {
            const meta = SECTION_META[key]
            const sec = landing[key]
            const open = openSec === key
            return (
              <div key={key}
                className={`lb-sec ${overIdx === i ? 'over' : ''}`}
                draggable
                onDragStart={() => { dragIdx.current = i }}
                onDragOver={(e) => { e.preventDefault(); setOverIdx(i) }}
                onDragLeave={() => setOverIdx(null)}
                onDrop={() => onDrop(i)}
              >
                <div className="lb-sec-head" onClick={() => setOpenSec(open ? '' : key)}>
                  <span className="lb-drag">⋮⋮</span>
                  <div className="lb-sec-meta">
                    <span className="lb-sec-name">{meta.name}</span>
                    <span className="lb-sec-desc">{meta.desc}</span>
                  </div>
                  <label className="lb-switch" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={sec.enabled} onChange={(e) => patch(key, { enabled: e.target.checked })} />
                    <span className="lb-switch-track"><span className="lb-switch-thumb" /></span>
                  </label>
                  <span className={`lb-chev ${open ? 'up' : ''}`}><Icon name="chevron" size={14} /></span>
                </div>

                {open && (
                  <div className="lb-sec-body">
                    {key === 'hero' && <>
                      <Lbi label="Heading" v={sec.heading} on={(v) => patch('hero', { heading: v })} />
                      <Lbt label="Subheading" v={sec.sub} on={(v) => patch('hero', { sub: v })} />
                      <Lbi label="Button text" v={sec.ctaText} on={(v) => patch('hero', { ctaText: v })} />
                      <ImageInput label="Hero image" value={sec.image} onChange={(v) => patch('hero', { image: v })} />
                    </>}
                    {key === 'about' && <>
                      <Lbi label="Title" v={sec.title} on={(v) => patch('about', { title: v })} />
                      <Lbt label="Body" v={sec.body} on={(v) => patch('about', { body: v })} rows={4} />
                      <ImageInput label="Section image" value={sec.image} onChange={(v) => patch('about', { image: v })} />
                      <Lbt label="Highlights (one per line)" v={(sec.points || []).join('\n')} on={(v) => patch('about', { points: v.split('\n') })} rows={3} />
                    </>}
                    {key === 'form' && <>
                      <div className="lb-two">
                        <Lbi label="Title" v={sec.title} on={(v) => patch('form', { title: v })} />
                        <Lbi label="Button text" v={sec.buttonText} on={(v) => patch('form', { buttonText: v })} />
                      </div>
                      <Lbi label="Subtitle" v={sec.sub} on={(v) => patch('form', { sub: v })} />
                      <Lbt label="Success message" v={sec.successMsg} on={(v) => patch('form', { successMsg: v })} rows={2} />
                      <span className="lb-k">Fields <em className="lb-soft">Name & Phone are always required</em></span>
                      <div className="lb-checks">
                        {FORM_FIELDS.map(([k, label]) => (
                          <label className="lb-check" key={k}>
                            <input type="checkbox" checked={sec.fields?.[k] !== false}
                              onChange={(e) => patch('form', { fields: { ...sec.fields, [k]: e.target.checked } })} />
                            <span className="lb-check-box"><Icon name="check" size={11} strokeWidth={2.6} /></span>
                            {label}
                          </label>
                        ))}
                      </div>
                    </>}
                  </div>
                )}
              </div>
            )
          })}
          <p className="lb-note">Changes save automatically — the public page updates instantly.</p>
        </div>

        {/* ================= Live preview ================= */}
        <div className="lb-preview">
          <div className="lb-preview-bar"><span>Live preview</span><span className="lb-preview-url">{url.replace(/^https?:\/\//, '')}</span></div>
          <div className="lb-frame">
            <div className="lb-scale">
              <div className="ls">
                <LandingRender landing={landing} agency={agency} onSubmit={previewSubmit} state="idle" formRef={formRef} />
                <LandingFooter agency={agency} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Lbi({ label, v, on }) {
  return <label className="lb-field"><span className="lb-k">{label}</span><input className="control" value={v || ''} onChange={(e) => on(e.target.value)} /></label>
}
function Lbt({ label, v, on, rows = 2 }) {
  return <label className="lb-field"><span className="lb-k">{label}</span><textarea className="control" rows={rows} value={v || ''} onChange={(e) => on(e.target.value)} /></label>
}
