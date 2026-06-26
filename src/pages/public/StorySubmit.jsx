import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { Card, Button, Field, Input, Textarea } from '../../components/ui/UI'

export default function StorySubmit() {
  const { addStory, toast } = useApp()
  const [f, setF] = useState({ client: '', rating: 5, text: '' })
  const [done, setDone] = useState(false)
  const submit = () => {
    if (!f.client || !f.text) return toast('Please add your name and story')
    addStory({ client: f.client, rating: Number(f.rating), text: f.text })
    setDone(true); toast('Story submitted — pending approval')
  }
  return (
    <div className="section" style={{ display: 'grid', placeItems: 'center' }}>
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
            <p className="t-body-sm c-body mt-xs mb-lg">Upload your photos and tell us about your trip.</p>
            <div className="upload-box text-center mb-base" style={{ padding: 28 }}>⤒ Upload photos / videos</div>
            <div className="col gap-base">
              <Field label="Your Name"><Input value={f.client} onChange={(e) => setF({ ...f, client: e.target.value })} /></Field>
              <Field label="Rating"><select className="control" value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}</select></Field>
              <Field label="Your Testimonial"><Textarea value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} /></Field>
              <Button className="w-full" onClick={submit}>Submit Story</Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
