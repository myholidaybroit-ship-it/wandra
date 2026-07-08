import { useState } from 'react'
import {
  PALETTES, PATTERNS, FRAMES, COVER_STYLES, FONT_CHOICES, SECTIONS,
  lighten, themeVars, patternBg,
} from '../../utils/pdfTheme'

/* ============================================================
   PDF Studio — the premium customiser panel for Holiday / Coastal.
   Every control mutates the config and calls onChange (which the
   parent persists per-package). Sections can be toggled + dragged
   to reorder. Pure client-side; the live preview re-renders instantly.
   ============================================================ */

const GROUPS = [
  { id: 'palette', label: 'Colour theme', icon: '' },
  { id: 'pattern', label: 'Background pattern', icon: '✦' },
  { id: 'frame', label: 'Frame & shape', icon: '▢' },
  { id: 'type', label: 'Typography', icon: 'Aa' },
  { id: 'elements', label: 'Elements', icon: '◻' },
  { id: 'sections', label: 'Sections — drag to reorder', icon: '⋮⋮' },
  { id: 'content', label: 'Custom text', icon: '✎' },
]

export default function PdfStudio({ variant, cfg, onChange, onReset, onClose, onDownload, busy }) {
  const [open, setOpen] = useState({ palette: true, pattern: true, sections: true })
  const set = (patch) => onChange({ ...cfg, ...patch })
  const toggleGroup = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }))
  const knownSections = SECTIONS[variant] || SECTIONS.holiday
  const labelOf = (id) => knownSections.find((s) => s.id === id)?.label || id
  const isFixed = (id) => knownSections.find((s) => s.id === id)?.fixed

  return (
    <aside className="pdf-studio no-print">
      <div className="st-head">
        <div>
          <div className="st-title">PDF Studio <span className="st-pro">PRO</span></div>
          <div className="st-sub">{variant === 'coastal' ? 'Coastal' : 'Holiday'} · live customisation</div>
        </div>
        <button className="st-x" onClick={onClose} title="Close studio">✕</button>
      </div>

      <div className="st-body">
        {/* ---- palette ---- */}
        <Group g={GROUPS[0]} open={open.palette} onToggle={() => toggleGroup('palette')}>
          <div className="st-swatches">
            {PALETTES.map((p) => (
              <button key={p.key} title={p.name}
                className={`st-swatch ${cfg.palette === p.key ? 'on' : ''}`}
                onClick={() => set({ palette: p.key, accent: p.accent, accent2: p.accent2, dark: !!p.dark })}
                style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.accent2})` }}>
                {cfg.palette === p.key && <span className="st-swatch-tick">✓</span>}
              </button>
            ))}
          </div>
          <div className="st-row">
            <label className="st-color">
              <span>Accent</span>
              <input type="color" value={cfg.accent} onChange={(e) => set({ accent: e.target.value, accent2: lighten(e.target.value, 0.28), palette: 'custom' })} />
            </label>
            <label className="st-color">
              <span>Secondary</span>
              <input type="color" value={cfg.accent2} onChange={(e) => set({ accent2: e.target.value, palette: 'custom' })} />
            </label>
            <label className={`st-toggle ${cfg.dark ? 'on' : ''}`}>
              <input type="checkbox" checked={cfg.dark} onChange={(e) => set({ dark: e.target.checked })} />
              <span>Dark paper</span>
            </label>
          </div>
        </Group>

        {/* ---- pattern ---- */}
        <Group g={GROUPS[1]} open={open.pattern} onToggle={() => toggleGroup('pattern')}>
          <div className="st-tiles">
            {PATTERNS.map((p) => (
              <button key={p.key} className={`st-tile ${cfg.pattern === p.key && cfg.showPattern ? 'on' : ''}`}
                onClick={() => set({ pattern: p.key, showPattern: p.key !== 'none' })}>
                <span className="st-tile-pv" style={patStyle(p.key, cfg.accent)} />
                <span className="st-tile-l">{p.name}</span>
              </button>
            ))}
          </div>
          <Slider label="Pattern intensity" min={0} max={1} step={0.05} value={cfg.patternStrength}
            disabled={!cfg.showPattern || cfg.pattern === 'none'}
            onChange={(v) => set({ patternStrength: v })} />
        </Group>

        {/* ---- frame & shape ---- */}
        <Group g={GROUPS[2]} open={open.frame} onToggle={() => toggleGroup('frame')}>
          <Chips options={FRAMES} value={cfg.frame} onChange={(v) => set({ frame: v })} />
          <div className="st-lbl">Cover style</div>
          <Chips options={COVER_STYLES} value={cfg.coverStyle} onChange={(v) => set({ coverStyle: v })} />
          <Slider label="Corner radius" min={0} max={28} step={1} value={cfg.radius} onChange={(v) => set({ radius: v })} suffix="px" />
          <Slider label="Cover overlay" min={0.1} max={0.9} step={0.05} value={cfg.overlay} onChange={(v) => set({ overlay: v })} />
        </Group>

        {/* ---- typography ---- */}
        <Group g={GROUPS[3]} open={open.type} onToggle={() => toggleGroup('type')}>
          <div className="st-fonts">
            {FONT_CHOICES.map((f) => (
              <button key={f.key} className={`st-font ${cfg.font === f.key ? 'on' : ''}`} onClick={() => set({ font: f.key })}>
                <span className="st-font-a" style={{ fontFamily: f.css }}>Ag</span>
                <span className="st-font-l">{f.name}</span>
              </button>
            ))}
          </div>
        </Group>

        {/* ---- element toggles ---- */}
        <Group g={GROUPS[4]} open={open.elements} onToggle={() => toggleGroup('elements')}>
          {[
            ['showWatermark', 'Watermark monogram'],
            ['showPrice', 'Price on cover / quote'],
            ['showDayImages', 'Photos in day-by-day'],
            ['showPattern', 'Background pattern'],
          ].map(([k, l]) => (
            <label key={k} className={`st-switch ${cfg[k] ? 'on' : ''}`}>
              <input type="checkbox" checked={!!cfg[k]} onChange={(e) => set({ [k]: e.target.checked })} />
              <span className="st-switch-tr"><i /></span>{l}
            </label>
          ))}
        </Group>

        {/* ---- sections (drag to reorder) ---- */}
        <Group g={GROUPS[5]} open={open.sections} onToggle={() => toggleGroup('sections')}>
          <SectionList sections={cfg.sections} labelOf={labelOf} isFixed={isFixed}
            onReorder={(next) => set({ sections: next })}
            onToggle={(id) => set({ sections: cfg.sections.map((s) => (s.id === id ? { ...s, on: !s.on } : s)) })} />
        </Group>

        {/* ---- custom text ---- */}
        <Group g={GROUPS[6]} open={open.content} onToggle={() => toggleGroup('content')}>
          <label className="st-field"><span>Headline override</span>
            <input type="text" value={cfg.headline} placeholder="Leave blank to use destination" onChange={(e) => set({ headline: e.target.value })} />
          </label>
          {variant === 'coastal' && (
            <label className="st-field"><span>Intro paragraph</span>
              <textarea rows={4} value={cfg.intro} placeholder="Leave blank for the default greeting" onChange={(e) => set({ intro: e.target.value })} />
            </label>
          )}
        </Group>
      </div>

      <div className="st-foot">
        <button className="st-reset" onClick={onReset}>Reset</button>
        <button className="st-dl" onClick={onDownload} disabled={busy}>{busy ? 'Preparing…' : 'Download PDF'}</button>
      </div>
    </aside>
  )
}

/* ---- collapsible group ---- */
function Group({ g, open, onToggle, children }) {
  return (
    <section className={`st-group ${open ? 'open' : ''}`}>
      <button className="st-group-h" onClick={onToggle}>
        <span className="st-group-ic" aria-hidden>{g.icon}</span>
        <span className="st-group-l">{g.label}</span>
        <span className="st-caret" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="st-group-b">{children}</div>}
    </section>
  )
}

/* ---- little controls ---- */
function Chips({ options, value, onChange }) {
  return (
    <div className="st-chiprow">
      {options.map((o) => (
        <button key={o.key} className={`st-c ${value === o.key ? 'on' : ''}`} onClick={() => onChange(o.key)}>{o.name}</button>
      ))}
    </div>
  )
}

function Slider({ label, min, max, step, value, onChange, disabled, suffix }) {
  const pct = Math.round((suffix === 'px' ? value : value * 100))
  return (
    <div className={`st-slider ${disabled ? 'dis' : ''}`}>
      <div className="st-slider-h"><span>{label}</span><em>{suffix === 'px' ? `${value}px` : `${pct}%`}</em></div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

/* ---- draggable section list ---- */
function SectionList({ sections, labelOf, isFixed, onReorder, onToggle }) {
  const [drag, setDrag] = useState(null)   // index being dragged
  const [over, setOver] = useState(null)   // index hovered

  const move = (from, to) => {
    if (from === to || from == null || to == null) return
    const next = [...sections]
    const [it] = next.splice(from, 1)
    next.splice(to, 0, it)
    onReorder(next)
  }

  return (
    <ul className="st-secs">
      {sections.map((s, i) => (
        <li key={s.id}
          className={`st-sec ${s.on ? '' : 'off'} ${drag === i ? 'dragging' : ''} ${over === i ? 'over' : ''}`}
          draggable
          onDragStart={() => setDrag(i)}
          onDragOver={(e) => { e.preventDefault(); setOver(i) }}
          onDragEnd={() => { setDrag(null); setOver(null) }}
          onDrop={(e) => { e.preventDefault(); move(drag, i); setDrag(null); setOver(null) }}>
          <span className="st-grip" aria-hidden>⋮⋮</span>
          <span className="st-sec-l">{labelOf(s.id)}</span>
          {isFixed(s.id)
            ? <span className="st-sec-fixed" title="Always shown">core</span>
            : <button className={`st-eye ${s.on ? 'on' : ''}`} onClick={() => onToggle(s.id)} title={s.on ? 'Hide section' : 'Show section'}>{s.on ? '' : ''}</button>}
        </li>
      ))}
      <li className="st-secs-hint">Drag ⋮⋮ to reorder · tap the eye to show / hide</li>
    </ul>
  )
}

/* small preview swatch for a pattern tile */
function patStyle(kind, accent) {
  const pat = patternBg(kind, accent, 0.9)
  const vars = themeVars({ accent, accent2: lighten(accent, 0.28) })
  return {
    backgroundColor: vars['--pdf-tint'],
    backgroundImage: pat.image === 'none' ? 'none' : pat.image,
    backgroundSize: pat.size,
    backgroundRepeat: 'repeat',
  }
}
