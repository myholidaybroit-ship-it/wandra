import { useRef, useState } from 'react'
import { useApp } from '../../store/AppContext'
import { Card, Button, Field, Input, Textarea } from '../../components/ui/UI'
import { AgencyLogo } from '../../components/ui/AgencyBrand'
import { fileToDataUrl } from '../../utils/image'
import './stories.css'

/* Sent by the agency to their traveller — their brand, no Wandra chrome. */
export default function StorySubmit() {
  const { addStory, agency, toast } = useApp()
  const [f, setF] = useState({ client: '', rating: 5, text: '', image: '' })
  const [hover, setHover] = useState(0)
  const [done, setDone] = useState(false)
  const fileRef = useRef(null)

  const pick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { setF({ ...f, image: await fileToDataUrl(file, 1200) }) }
    catch { toast('Could not read that image — try another one') }
    e.target.value = ''
  }

  const submit = () => {
    if (!f.client || !f.text) return toast('Please add your name and story')
    addStory({ client: f.client, rating: f.rating, text: f.text, image: f.image })
    setDone(true); toast('Story submitted — pending approval')
  }

  return (
    <div className="st">
      <header className="st-head" style={{ padding: '52px 24px 8px' }}>
        <AgencyLogo className="st-logo" fallback="name" />
      </header>
      <div className="st-submit">
      <Card pad={32} style={{ maxWidth: 520, width: '100%' }}>
        {done ? (
          <div className="text-center">
            <div className="feat-icon" style={{ margin: '0 auto', background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>✓</div>
            <h2 className="t-display-sm mt-base">Thank you!</h2>
            <p className="t-body-md c-body mt-xs">Your story has been submitted successfully. You can close this window.</p>
          </div>
        ) : (
          <>
            <h2 className="t-display-sm">Share Your Journey</h2>
            <p className="t-body-sm c-body mt-xs mb-lg">Upload a photo and tell us about your trip.</p>

            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
            {f.image ? (
              <div className="story-photo mb-base">
                <img src={f.image} alt="Your trip" />
                <div className="story-photo-acts">
                  <button onClick={() => fileRef.current?.click()}>Replace</button>
                  <button onClick={() => setF({ ...f, image: '' })}>Remove</button>
                </div>
              </div>
            ) : (
              <button className="upload-box text-center mb-base" style={{ padding: 28, width: '100%', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                onClick={() => fileRef.current?.click()}>⤒ Upload a trip photo</button>
            )}

            <div className="col gap-base">
              <Field label="Your Name"><Input value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} /></Field>
              <Field label="Rating">
                <div className="star-pick" onMouseLeave={() => setHover(0)}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      className={`star-btn ${(hover || f.rating) >= n ? 'on' : ''}`}
                      onMouseEnter={() => setHover(n)}
                      onClick={() => setF({ ...f, rating: n })}>★</button>
                  ))}
                  <span className="star-val">{(hover || f.rating)}/5</span>
                </div>
              </Field>
              <Field label="Your Testimonial"><Textarea value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
              <Button className="w-full" onClick={submit}>Submit Story</Button>
            </div>
          </>
        )}
      </Card>
      </div>
      <footer className="st-foot">
        <span>{agency.name} · {agency.phone} · {agency.email}</span>
        <span className="st-powered">POWERED BY <strong>WANDRA</strong></span>
      </footer>
    </div>
  )
}
