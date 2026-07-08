/* ============================================================
   Client-side PDF download (real .pdf file, not the print dialog)
   — html2pdf.js is dynamically imported so it stays out of the
     main bundle until someone actually downloads.
   ============================================================ */

// Resolve every image the element paints (both <img> and CSS background-image)
// and wait for them so html2canvas never snapshots a blank frame.
export function preloadImages(el) {
  if (!el) return Promise.resolve()
  const urls = new Set()
  el.querySelectorAll('img').forEach((i) => { if (i.src) urls.add(i.src) })
  el.querySelectorAll('*').forEach((n) => {
    const bg = getComputedStyle(n).backgroundImage
    const m = bg && bg.match(/url\(["']?(https?:[^"')]+)["']?\)/)
    if (m) urls.add(m[1])
  })
  return Promise.all([...urls].map((u) => new Promise((res) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = res
    img.onerror = res
    img.src = u
    if (img.complete) res()
  })))
}

export async function downloadElementPdf(el, filename = 'document.pdf') {
  if (!el) return
  const mod = await import('html2pdf.js')
  const html2pdf = mod.default || mod

  // A "flow" doc (premium Holiday/Coastal studio) is one continuous sheet whose
  // sections can be reordered freely — jsPDF slices it into A4 pages, so it needs
  // a repeated top/bottom page margin. Fixed-layout docs keep hard page breaks.
  const flow = el.dataset.pdfFlow === '1'
  const pages = [...el.querySelectorAll('.pdf-page')]
  const savedPages = pages.map((p) => p.style.cssText)
  pages.forEach((p, i) => {
    p.style.margin = '0'; p.style.boxShadow = 'none'; p.style.borderRadius = '0'; p.style.minHeight = '0'
    if (!flow) {
      p.style.breakBefore = i > 0 ? 'page' : 'auto'
      p.style.pageBreakBefore = i > 0 ? 'always' : 'auto'
    }
  })
  const hidden = [...el.querySelectorAll('.no-print, [data-no-pdf]')]
  const savedHidden = hidden.map((h) => h.style.display)
  hidden.forEach((h) => { h.style.display = 'none' })

  try {
    await html2pdf().set({
      filename,
      margin: flow ? [11, 0, 13, 0] : 0,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      // 'avoid-all' keeps cards/days/tables from being sliced across a page edge
      pagebreak: flow ? { mode: ['css', 'legacy'], avoid: ['.pdf-avoid', 'tr', 'img'] } : { mode: ['css', 'legacy'] },
    }).from(el).save()
  } finally {
    pages.forEach((p, i) => { p.style.cssText = savedPages[i] })
    hidden.forEach((h, i) => { h.style.display = savedHidden[i] })
  }
}

// Preload images, then download — the one call most pages use.
export async function preloadAndDownload(el, filename) {
  await preloadImages(el)
  await downloadElementPdf(el, filename)
}
