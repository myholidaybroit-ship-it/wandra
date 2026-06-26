import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHeader, Card, Button, Badge, Modal, Field, Input, Select } from '../../components/ui/UI'

export default function Gallery() {
  const { gallery, approveStory, clients, bookings, toast } = useApp()
  const [tab, setTab] = useState('queue')
  const [open, setOpen] = useState(false)
  const pending = gallery.filter((g) => g.status === 'Pending')
  const published = gallery.filter((g) => g.status === 'Published')
  const link = `${window.location.origin}/share-story/abc123`

  return (
    <div>
      <PageHeader title="Traveler Gallery & Testimonials" subtitle="Collect trip stories and build your public portfolio."
        actions={<><Button variant="secondary" onClick={() => setOpen(true)}>Create Link</Button><Button as="a" href={`/stories/wandra`} target="_blank">View Gallery ↗</Button></>} />

      <div className="grid grid-3">
        <Card pad={20}><div className="t-caption-upper c-muted">Pending Reviews</div><div className="t-display-sm mt-xs">{pending.length}</div></Card>
        <Card pad={20}><div className="t-caption-upper c-muted">Published Stories</div><div className="t-display-sm mt-xs">{published.length}</div></Card>
        <Card pad={20}><div className="t-caption-upper c-muted">Cloud Storage</div><div className="t-display-sm mt-xs">0.4 <span className="t-body-sm c-muted">/ 200 MB</span></div></Card>
      </div>

      <div className="tabs mt-lg">
        <span className={`pill-tab ${tab === 'queue' ? 'active' : ''}`} onClick={() => setTab('queue')}>Moderation Queue</span>
        <span className={`pill-tab ${tab === 'published' ? 'active' : ''}`} onClick={() => setTab('published')}>Published Stories</span>
      </div>

      <div className="grid grid-3 mt-base">
        {(tab === 'queue' ? pending : published).map((g) => (
          <Card key={g.id}>
            <div className="row-between"><span className="t-title-sm">{g.client}</span><Badge tone={g.status}>{g.status}</Badge></div>
            <div className="c-warning mt-xs">{'★'.repeat(g.rating)}</div>
            <p className="t-body-sm c-body mt-xs">“{g.text}”</p>
            <div className="t-caption c-muted mt-sm">{g.date}</div>
            {g.status === 'Pending' && <Button size="sm" className="mt-base" onClick={() => { approveStory(g.id); toast('Story published') }}>Approve & Publish</Button>}
          </Card>
        ))}
        {(tab === 'queue' ? pending : published).length === 0 && <Card><div className="t-body-sm c-muted">Nothing here yet.</div></Card>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create Story Link"
        footer={<Button onClick={() => { navigator.clipboard?.writeText(link); toast('Story link copied'); setOpen(false) }}>Copy Link</Button>}>
        <div className="col gap-base">
          <Field label="Client"><Select>{clients.map((c) => <option key={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Related Booking"><Select>{bookings.map((b) => <option key={b.id}>{b.code}</option>)}</Select></Field>
          <div className="mono t-caption c-muted" style={{ wordBreak: 'break-all', background: 'var(--color-surface-strong)', padding: 12, borderRadius: 8 }}>{link}</div>
        </div>
      </Modal>
    </div>
  )
}
