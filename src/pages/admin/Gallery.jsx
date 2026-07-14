import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, PillSelect, ConfirmDelete } from '../../components/ui/UI'
import '../public/stories.css'

const slugify = (v) => String(v || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

export default function Gallery() {
  const { gallery, approveStory, removeStory, clients, bookings, agency, landing, toast } = useApp()
  const [tab, setTab] = useState('queue')
  const [open, setOpen] = useState(false)
  const [selClient, setSelClient] = useState(clients[0]?.name || '')
  const [selBooking, setSelBooking] = useState(bookings[0]?.code || '')
  const defaultSuffix = slugify(agency?.name) || landing?.slug || agency?.code || ''
  const [suffix, setSuffix] = useState(defaultSuffix)
  const pending = gallery.filter((g) => g.status === 'Pending')
  const published = gallery.filter((g) => g.status === 'Published')
  const avg = published.length ? published.reduce((s, g) => s + (g.rating || 0), 0) / published.length : 0
  const cleanSuffix = slugify(suffix) || defaultSuffix
  const link = `${window.location.origin}/share-story/${encodeURIComponent(cleanSuffix)}`
  const galleryLink = `/stories/${encodeURIComponent(cleanSuffix)}`

  return (
    <div>
      <PageHeader title="Traveler Gallery & Testimonials" subtitle="Collect trip stories and build your public portfolio."
        actions={<><Button variant="secondary" onClick={() => setOpen(true)}>Create Link</Button><Button as="a" href={galleryLink} target="_blank">View Gallery ↗</Button></>} />

      <div className="grid grid-3">
        <Card pad={20}><div className="t-caption-upper c-muted">Pending Reviews</div><div className="t-display-sm mt-xs">{pending.length}</div></Card>
        <Card pad={20}><div className="t-caption-upper c-muted">Published Stories</div><div className="t-display-sm mt-xs">{published.length}</div></Card>
        <Card pad={20}><div className="t-caption-upper c-muted">Average Rating</div><div className="t-display-sm mt-xs">{published.length ? avg.toFixed(1) : '—'} <span className="t-body-sm" style={{ color: '#d99a1b' }}>★</span></div></Card>
      </div>

      <div className="tabs mt-lg">
        <span className={`pill-tab ${tab === 'queue' ? 'active' : ''}`} onClick={() => setTab('queue')}>Moderation Queue</span>
        <span className={`pill-tab ${tab === 'published' ? 'active' : ''}`} onClick={() => setTab('published')}>Published Stories</span>
      </div>

      <div className="grid grid-3 mt-base">
        {(tab === 'queue' ? pending : published).map((g) => (
          <article className="st-card" key={g.id}>
            <div className="row-between"><span className="st-stars">{'★'.repeat(g.rating)}<span className="dim">{'★'.repeat(5 - g.rating)}</span></span><Badge tone={g.status}>{g.status}</Badge></div>
            <p className="st-text">{g.text}</p>
            <footer className="st-byline">
              <span className="st-avatar">{g.client[0]}</span>
              <span className="st-who"><strong>{g.client}</strong><em>{g.date}</em></span>
            </footer>
            <div className="row gap-xs mt-base">
              {g.status === 'Pending' && <Button size="sm" onClick={() => { approveStory(g.id); toast('Story published') }}>Approve & Publish</Button>}
              <ConfirmDelete label="Delete" what={`${g.client}'s review`} onConfirm={async () => { await removeStory(g.id); toast('Review deleted') }} />
            </div>
          </article>
        ))}
        {(tab === 'queue' ? pending : published).length === 0 && <div className="st-empty">Nothing here yet.</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Story Link"
        footer={<Button onClick={() => { navigator.clipboard?.writeText(link); toast('Story link copied'); setOpen(false) }}>Copy Link</Button>}>
        <div className="col gap-base">
          <Field label="Client"><PillSelect value={selClient} options={clients.map((c) => c.name)} onChange={setSelClient} /></Field>
          <Field label="Related Booking"><PillSelect value={selBooking} options={bookings.map((b) => b.code)} onChange={setSelBooking} /></Field>
          <Field label="Review link suffix" hint="Use landing page slug or company code">
            <Input value={suffix} onChange={(e) => setSuffix(e.target.value)} placeholder={defaultSuffix || 'your-company'} />
          </Field>
          <div className="mono t-caption c-muted" style={{ wordBreak: 'break-all', background: 'var(--color-surface-strong)', padding: 12, borderRadius: 8 }}>{link}</div>
        </div>
      </Modal>
    </div>
  )
}
