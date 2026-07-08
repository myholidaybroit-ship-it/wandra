import { useParams } from 'react-router-dom'
import { usePublic } from '../../hooks/usePublic'
import './stories.css'

/* Agency-facing share page — their brand only, Wandra just powers it. */
export default function PublicGallery() {
  const { agency: slug } = useParams()
  const { data, loading } = usePublic(`/stories/${slug}`)
  const agency = data?.agency || {}
  const published = data?.stories || []
  const avg = published.length ? published.reduce((s, g) => s + (g.rating || 0), 0) / published.length : 0

  if (loading) return <div className="st"><header className="st-head"><p>Loading…</p></header></div>

  return (
    <div className="st">
      <header className="st-head">
        {agency.logo && <img className="st-logo" src={agency.logo} alt={agency.name} />}
        <h1 className="st-title">Traveler Stories</h1>
        <p className="st-sub">Real trips, real reviews from travellers who booked with {agency.name}.</p>
        {published.length > 0 && (
          <div className="st-agg">
            <span className="st-stars">{'★'.repeat(Math.round(avg))}<span className="dim">{'★'.repeat(5 - Math.round(avg))}</span></span>
            {avg.toFixed(1)} · {published.length} traveller stor{published.length === 1 ? 'y' : 'ies'}
          </div>
        )}
      </header>

      <div className="st-grid">
        {published.map((g) => (
          <article className="st-card" key={g.id}>
            {g.image && <img className="st-photo" src={g.image} alt="" />}
            <span className="st-qmark">”</span>
            <span className="st-stars">{'★'.repeat(g.rating)}<span className="dim">{'★'.repeat(5 - g.rating)}</span></span>
            <p className="st-text">{g.text}</p>
            <footer className="st-byline">
              <span className="st-avatar">{g.client[0]}</span>
              <span className="st-who"><strong>{g.client}</strong><em>Travelled · {g.date}</em></span>
            </footer>
          </article>
        ))}
        {published.length === 0 && <div className="st-empty">Stories are on their way — check back soon.</div>}
      </div>

      <footer className="st-foot">
        <span>{agency.name} · {agency.phone} · {agency.email}</span>
        <span className="st-powered">POWERED BY <strong>WANDRA</strong></span>
      </footer>
    </div>
  )
}
