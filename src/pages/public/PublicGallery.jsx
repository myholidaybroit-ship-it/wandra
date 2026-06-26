import { useApp } from '../../store/AppContext'
import { Card } from '../../components/ui/UI'

export default function PublicGallery() {
  const { gallery, agency } = useApp()
  const published = gallery.filter((g) => g.status === 'Published')
  return (
    <div className="section" style={{ maxWidth: 'var(--container-max)', margin: '0 auto' }}>
      <div className="text-center">
        <div className="t-caption-upper c-muted">{agency.name}</div>
        <h1 className="t-display-lg mt-xs">Traveler Stories</h1>
        <p className="t-body-md c-body mt-sm">Real trips, real reviews from our travelers.</p>
      </div>
      <div className="grid grid-3 mt-xl">
        {published.map((g) => (
          <Card key={g.id}>
            <div className="ip-hero" style={{ height: 150, borderRadius: 'var(--radius-md)' }} />
            <div className="row gap-sm mt-base"><div className="acct-avatar" style={{ background: 'var(--color-surface-dark)' }}>{g.client[0]}</div><div><div className="cell-strong">{g.client}</div><div className="c-warning">{'★'.repeat(g.rating)}</div></div></div>
            <p className="t-body-sm c-body mt-sm">“{g.text}”</p>
            <div className="t-caption c-muted mt-xs">{g.date}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
