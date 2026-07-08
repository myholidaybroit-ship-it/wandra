/* ============================================================
   PDF Studio — theming engine for the premium (Holiday / Coastal)
   layouts. Everything a user can tweak in the studio funnels
   through here: colour maths, curated travel palettes, decorative
   travel patterns, the reorderable section registry and per-theme
   default configs.

   Colours are resolved to concrete hex/rgba in JS (never CSS
   color-mix) so html2canvas — which rasterises the PDF — always sees
   a real value it can paint.
   ============================================================ */

/* ---------- colour maths ---------- */
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
export function hexToRgb(hex) {
  const h = String(hex || '#000').replace('#', '')
  const s = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6)
  const n = parseInt(s, 16) || 0
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
export const rgbToHex = ({ r, g, b }) => '#' + [r, g, b].map((x) => clamp(x).toString(16).padStart(2, '0')).join('')
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b)
  return rgbToHex({ r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t })
}
export const lighten = (hex, t) => mix(hex, '#ffffff', t)
export const darken = (hex, t) => mix(hex, '#000000', t)
export function rgba(hex, a) { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})` }
export function luminance(hex) { const { r, g, b } = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 }
export const readableOn = (hex) => (luminance(hex) > 0.62 ? '#241c17' : '#ffffff')

/* ---------- curated travel palettes ---------- */
export const PALETTES = [
  { key: 'sunset', name: 'Sunset Coral', accent: '#f2603f', accent2: '#ff9d63' },
  { key: 'saffron', name: 'Saffron Gold', accent: '#e0912f', accent2: '#f6c667' },
  { key: 'rose', name: 'Rose Wine', accent: '#d6455f', accent2: '#f58aa0' },
  { key: 'ocean', name: 'Ocean Blue', accent: '#1a73e8', accent2: '#5aa9ff' },
  { key: 'lagoon', name: 'Lagoon Teal', accent: '#0e909c', accent2: '#48c9d1' },
  { key: 'emerald', name: 'Emerald Trail', accent: '#12996a', accent2: '#57cf9d' },
  { key: 'forest', name: 'Pine Forest', accent: '#2f7d4f', accent2: '#79c088' },
  { key: 'violet', name: 'Twilight Plum', accent: '#7a53c8', accent2: '#b39cf0' },
  { key: 'berry', name: 'Berry Punch', accent: '#c02a86', accent2: '#f078b6' },
  { key: 'graphite', name: 'Graphite', accent: '#3a4150', accent2: '#7b8497' },
  { key: 'midnight', name: 'Midnight Gold', accent: '#d7b168', accent2: '#efd398', dark: true },
  { key: 'noir', name: 'Emerald Noir', accent: '#4fd0a0', accent2: '#8fe6c4', dark: true },
]

/* ---------- fonts (loaded in index.html) ---------- */
export const FONTS = {
  sans: "'DM Sans','Inter',system-ui,sans-serif",
  serif: "'Playfair Display','Georgia',serif",
  display: "'Poppins','DM Sans',sans-serif",
}
export const FONT_CHOICES = [
  { key: 'sans', name: 'Clean Sans', sample: 'Aa', css: FONTS.sans },
  { key: 'display', name: 'Bold Display', sample: 'Aa', css: FONTS.display },
  { key: 'serif', name: 'Elegant Serif', sample: 'Aa', css: FONTS.serif },
]

export const PATTERNS = [
  { key: 'none', name: 'None' },
  { key: 'topo', name: 'Topographic' },
  { key: 'journey', name: 'Flight Path' },
  { key: 'waves', name: 'Coastal Waves' },
  { key: 'compass', name: 'Compass' },
  { key: 'palm', name: 'Tropical' },
  { key: 'dots', name: 'Fine Dots' },
  { key: 'zigzag', name: 'Aztec' },
]

export const FRAMES = [
  { key: 'none', name: 'None' },
  { key: 'hairline', name: 'Hairline' },
  { key: 'double', name: 'Double Rule' },
  { key: 'ticket', name: 'Boarding Pass' },
  { key: 'corners', name: 'Corner Marks' },
]

export const COVER_STYLES = [
  { key: 'full', name: 'Full bleed' },
  { key: 'framed', name: 'Framed inset' },
  { key: 'postcard', name: 'Postcard' },
]

/* ---------- reorderable sections per theme ---------- */
export const SECTIONS = {
  holiday: [
    { id: 'cover', label: 'Cover hero', fixed: true },
    { id: 'trust', label: 'Trust badges' },
    { id: 'guest', label: 'Guest card' },
    { id: 'schedule', label: 'Trip schedule' },
    { id: 'itinerary', label: 'Day-by-day' },
    { id: 'hotels', label: 'Where you’ll stay' },
    { id: 'flights', label: 'Flights' },
    { id: 'inclusions', label: 'Inclusions & exclusions' },
    { id: 'notes', label: 'Notes' },
    { id: 'signature', label: 'Signature', fixed: true },
  ],
  coastal: [
    { id: 'letter', label: 'Cover letter', fixed: true },
    { id: 'info', label: 'Trip info grid' },
    { id: 'quote', label: 'Quote price' },
    { id: 'cover', label: 'Cover banner' },
    { id: 'hotels', label: 'Hotels' },
    { id: 'services', label: 'Transport & activities' },
    { id: 'flights', label: 'Flights' },
    { id: 'itinerary', label: 'Day-wise itinerary' },
    { id: 'inclusions', label: 'Inclusions & exclusions' },
    { id: 'notes', label: 'Notes' },
    { id: 'signature', label: 'Signature', fixed: true },
  ],
}

/* ---------- per-theme default config ---------- */
function baseCfg() {
  return {
    patternStrength: 0.5, frame: 'hairline', radius: 16, font: 'sans',
    coverStyle: 'full', overlay: 0.55,
    showTrust: true, showGuest: true, showWatermark: true, showPrice: true,
    showDayImages: true, showDividers: true, showPattern: true,
    headline: '', intro: '',
  }
}
export function defaultCfg(variant) {
  if (variant === 'coastal') {
    return {
      ...baseCfg(), variant: 'coastal', palette: 'ocean', accent: '#1a73e8', accent2: '#5aa9ff',
      dark: false, pattern: 'waves',
      sections: SECTIONS.coastal.map((s) => ({ id: s.id, on: true })),
    }
  }
  return {
    ...baseCfg(), variant: 'holiday', palette: 'sunset', accent: '#f2603f', accent2: '#ff9d63',
    dark: false, pattern: 'topo',
    sections: SECTIONS.holiday.map((s) => ({ id: s.id, on: true })),
  }
}

/* Merge a stored (possibly partial / older) config over fresh defaults,
   and heal the section list so newly-added sections always appear. */
export function normalizeCfg(variant, stored) {
  const def = defaultCfg(variant)
  if (!stored) return def
  const merged = { ...def, ...stored }
  const known = SECTIONS[variant] || SECTIONS.holiday
  const savedById = new Map((stored.sections || []).map((s) => [s.id, s]))
  const ordered = (stored.sections || []).filter((s) => known.some((k) => k.id === s.id))
  known.forEach((k) => { if (!savedById.has(k.id)) ordered.push({ id: k.id, on: true }) })
  merged.sections = ordered.length ? ordered : def.sections
  return merged
}

/* ---------- resolve config → CSS custom properties ---------- */
export function themeVars(cfg) {
  const dark = !!cfg.dark
  const paper = dark ? '#16171f' : '#ffffff'
  const ink = dark ? '#f1ede2' : '#241c17'
  const accent = cfg.accent || '#f2603f'
  const accent2 = cfg.accent2 || lighten(accent, 0.28)
  return {
    '--pdf-accent': accent,
    '--pdf-accent2': accent2,
    '--pdf-accent-deep': darken(accent, 0.24),
    '--pdf-accent-ink': readableOn(accent),
    '--pdf-ink': ink,
    '--pdf-ink-soft': mix(ink, paper, 0.42),
    '--pdf-ink-faint': mix(ink, paper, 0.6),
    '--pdf-paper': paper,
    '--pdf-panel': dark ? mix(paper, '#ffffff', 0.05) : mix(accent, paper, 0.94),
    '--pdf-tint': mix(accent, paper, 0.9),
    '--pdf-tint2': mix(accent, paper, 0.82),
    '--pdf-line': mix(accent, paper, dark ? 0.7 : 0.68),
    '--pdf-line-soft': mix(accent, paper, dark ? 0.82 : 0.8),
    '--pdf-hair': dark ? 'rgba(255,255,255,.1)' : mix(ink, paper, 0.86),
    '--pdf-chip': mix(accent, paper, 0.86),
    '--pdf-radius': (cfg.radius ?? 16) + 'px',
    '--pdf-radius-sm': Math.max(4, (cfg.radius ?? 16) - 6) + 'px',
    '--pdf-font': FONTS[cfg.font] || FONTS.sans,
  }
}

/* ---------- decorative travel patterns → CSS background value ----------
   Returns a `url("data:image/svg+xml,...")` string (or 'none'), recoloured
   by `color` at `op` opacity so it always harmonises with the accent. */
export function patternBg(kind, color, op = 0.08) {
  if (!kind || kind === 'none') return { image: 'none', size: 'auto' }
  const c = String(color || '#000')
  const svg = (w, h, body) =>
    `url("data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${body}</svg>`,
    )}")`
  const stroke = `stroke='${c}' stroke-opacity='${op}' fill='none'`
  const fill = `fill='${c}' fill-opacity='${op}'`
  switch (kind) {
    case 'dots':
      return { image: svg(24, 24, `<circle cx='3' cy='3' r='1.5' ${fill}/>`), size: '24px 24px' }
    case 'waves':
      return {
        image: svg(120, 26, `<path d='M0 18 Q15 6 30 18 T60 18 T90 18 T120 18' ${stroke} stroke-width='1.4'/><path d='M0 8 Q15 -4 30 8 T60 8 T90 8 T120 8' ${stroke} stroke-width='1.1' stroke-opacity='${op * 0.6}'/>`),
        size: '120px 26px',
      }
    case 'topo':
      return {
        image: svg(150, 150, `<g ${stroke} stroke-width='1.1'>
          <path d='M-10 60 q40 -46 80 -16 q40 30 90 -6'/>
          <path d='M-10 88 q46 -50 92 -14 q42 34 78 -4'/>
          <path d='M20 40 q30 -30 58 -10'/>
          <path d='M-10 118 q50 -40 100 -10 q30 18 70 4'/>
        </g>`),
        size: '150px 150px',
      }
    case 'journey':
      return {
        image: svg(170, 120, `<g ${stroke} stroke-width='1.2'>
          <path d='M14 100 C60 20 120 26 156 54' stroke-dasharray='2 6' stroke-linecap='round'/>
        </g>
        <circle cx='14' cy='100' r='2.6' ${fill}/>
        <circle cx='156' cy='54' r='2.6' ${fill}/>
        <path d='M92 33 l14 5 l-4 5 l-11 -2 l-6 7 l-4 -1 l2 -8 l-9 -4 l2 -3 l10 2 l6 -6 l3 1 z' ${fill}/>`),
        size: '170px 120px',
      }
    case 'compass':
      return {
        image: svg(130, 130, `<g ${stroke} stroke-width='1'>
          <circle cx='65' cy='65' r='30'/><circle cx='65' cy='65' r='40'/>
        </g>
        <path d='M65 28 L71 65 L65 102 L59 65 Z' ${fill}/>
        <path d='M28 65 L65 59 L102 65 L65 71 Z' ${stroke} stroke-width='1'/>`),
        size: '130px 130px',
      }
    case 'palm':
      return {
        image: svg(110, 110, `<g ${stroke} stroke-width='1.1' stroke-linecap='round'>
          <path d='M55 96 C55 70 55 52 55 34'/>
          <path d='M55 40 C40 28 30 30 20 40'/><path d='M55 40 C70 28 80 30 90 40'/>
          <path d='M55 52 C42 44 33 47 26 56'/><path d='M55 52 C68 44 77 47 84 56'/>
          <path d='M55 64 C45 60 38 63 33 70'/><path d='M55 64 C65 60 72 63 77 70'/>
        </g>`),
        size: '110px 110px',
      }
    case 'zigzag':
      return {
        image: svg(40, 20, `<path d='M0 16 L10 4 L20 16 L30 4 L40 16' ${stroke} stroke-width='1.3'/>`),
        size: '40px 20px',
      }
    default:
      return { image: 'none', size: 'auto' }
  }
}
