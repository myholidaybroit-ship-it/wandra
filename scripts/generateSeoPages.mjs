import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const output = path.join(root, 'public', 'seo')
const siteUrl = (process.env.SEO_SITE_URL || 'https://wandra.travel').replace(/\/$/, '')

const hyderabad = [
  'Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'HITEC City', 'Madhapur', 'Kondapur', 'Kothaguda', 'Nanakramguda', 'Financial District', 'Kokapet',
  'Narsingi', 'Puppalaguda', 'Manikonda', 'Khajaguda', 'Tellapur', 'Nallagandla', 'Gopanapalli', 'Osman Nagar', 'Serilingampally', 'Miyapur',
  'Hafeezpet', 'Chandanagar', 'Lingampally', 'Kukatpally', 'KPHB Colony', 'Nizampet', 'Bachupally', 'Pragathi Nagar', 'Moosapet', 'Balanagar',
  'Jeedimetla', 'Quthbullapur', 'Suchitra', 'Kompally', 'Medchal', 'Bowenpally', 'Alwal', 'Malkajgiri', 'Sainikpuri', 'ECIL',
  'Kapra', 'AS Rao Nagar', 'Neredmet', 'Marredpally', 'Trimulgherry', 'Secunderabad', 'Begumpet', 'Somajiguda', 'Punjagutta', 'Ameerpet',
  'SR Nagar', 'Erragadda', 'Sanathnagar', 'Khairatabad', 'Lakdikapul', 'Basheerbagh', 'Himayatnagar', 'Narayanguda', 'Kachiguda', 'Nallakunta',
  'Vidyanagar', 'Amberpet', 'Ramanthapur', 'Tarnaka', 'Habsiguda', 'Nacharam', 'Uppal', 'Boduppal', 'Pocharam', 'Nagole',
  'LB Nagar', 'Kothapet', 'Dilsukhnagar', 'Saroornagar', 'Vanasthalipuram', 'Hayathnagar', 'Attapur', 'Mehdipatnam', 'Tolichowki', 'Masab Tank',
  'Shaikpet', 'Film Nagar', 'Langer House', 'Rajendranagar', 'Bandlaguda Jagir', 'Kismatpur', 'Sun City', 'Shamshabad', 'Rajiv Gandhi International Airport', 'Shankarpally',
  'Mokila', 'Chevella', 'Maheshwaram', 'Adibatla', 'Ibrahimpatnam', 'Tukkuguda', 'Falaknuma', 'Abids', 'Charminar', 'Nampally',
]

const westIndia = [
  'Mumbai', 'South Mumbai', 'Andheri', 'Bandra', 'Powai', 'Thane', 'Navi Mumbai', 'Vashi', 'Panvel', 'Borivali',
  'Goregaon', 'Malad', 'Kandivali', 'Mira Road', 'Vasai', 'Virar', 'Kalyan', 'Dombivli', 'Airoli', 'Chembur',
  'Colaba', 'Lower Parel', 'Worli', 'Bandra Kurla Complex', 'Pune', 'Hinjewadi', 'Baner', 'Wakad', 'Kharadi', 'Viman Nagar',
  'Koregaon Park', 'Hadapsar', 'Kothrud', 'Pimpri-Chinchwad', 'Talegaon', 'Lonavala', 'Mahabaleshwar', 'Nashik', 'Chhatrapati Sambhajinagar', 'Nagpur',
  'Ahmedabad', 'Gandhinagar', 'Surat', 'Vadodara', 'Rajkot', 'Jamnagar', 'Bhavnagar', 'Anand', 'Bharuch', 'Vapi',
  'Navsari', 'Dwarka Gujarat', 'Somnath', 'Kutch', 'Bhuj', 'Saputara', 'Panaji', 'North Goa', 'South Goa', 'Calangute',
  'Baga', 'Candolim', 'Anjuna', 'Vagator', 'Morjim', 'Arambol', 'Margao', 'Vasco da Gama', 'Jaipur', 'Udaipur',
  'Jodhpur', 'Jaisalmer', 'Ajmer', 'Pushkar', 'Mount Abu', 'Bikaner', 'Kota', 'Ranthambore', 'Alwar', 'Bharatpur',
  'Indore', 'Bhopal', 'Ujjain', 'Gwalior', 'Jabalpur', 'Khajuraho', 'Sanchi', 'Pachmarhi', 'Mandu', 'Omkareshwar',
  'Raipur', 'Bilaspur Chhattisgarh', 'Daman', 'Diu', 'Silvassa', 'Rann of Kutch', 'Matheran', 'Alibaug', 'Kashid', 'Igatpuri',
]

const india = [
  'Delhi', 'New Delhi', 'Gurugram', 'Noida', 'Faridabad', 'Chandigarh', 'Amritsar', 'Ludhiana', 'Shimla', 'Manali',
  'Dharamshala', 'Dalhousie', 'Dehradun', 'Mussoorie', 'Rishikesh', 'Haridwar', 'Nainital', 'Jim Corbett', 'Varanasi', 'Agra',
  'Lucknow', 'Kanpur', 'Prayagraj', 'Ayodhya', 'Mathura', 'Vrindavan', 'Kashmir', 'Srinagar', 'Gulmarg', 'Pahalgam',
  'Sonamarg', 'Leh', 'Ladakh', 'Jammu', 'Amarnath', 'Kolkata', 'Darjeeling', 'Siliguri', 'Kalimpong', 'Sikkim',
  'Gangtok', 'Pelling', 'Shillong', 'Guwahati', 'Kaziranga', 'Tawang', 'Arunachal Pradesh', 'Kohima', 'Imphal', 'Agartala',
  'Bengaluru', 'Mysuru', 'Coorg', 'Chikmagalur', 'Hampi', 'Mangaluru', 'Gokarna', 'Hyderabad', 'Vijayawada', 'Visakhapatnam',
  'Araku Valley', 'Chennai', 'Mahabalipuram', 'Pondicherry', 'Madurai', 'Ooty', 'Kodaikanal', 'Coimbatore', 'Kerala', 'Kochi',
  'Munnar', 'Alappuzha', 'Thekkady', 'Wayanad', 'Thiruvananthapuram', 'Kovalam', 'Rameswaram', 'Tirupati', 'Bhubaneswar', 'Puri',
  'Konark', 'Ranchi', 'Jamshedpur', 'Patna', 'Bodh Gaya', 'Sundarbans', 'Andaman Islands', 'Port Blair', 'Lakshadweep', 'Diu Island',
  'Vellore', 'Kanyakumari', 'Thanjavur', 'Tiruchirappalli', 'Nellore', 'Kurnool', 'Warangal', 'Sasan Gir', 'Dhanaulti', 'Chitrakoot',
]

const world = [
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Doha', 'Muscat', 'Manama', 'Riyadh', 'Jeddah', 'AlUla',
  'Istanbul', 'Cappadocia', 'Baku', 'Tbilisi', 'Yerevan', 'Tashkent', 'Almaty', 'Singapore', 'Kuala Lumpur', 'Langkawi',
  'Penang', 'Bangkok', 'Phuket', 'Krabi', 'Pattaya', 'Chiang Mai', 'Bali', 'Ubud', 'Jakarta', 'Lombok',
  'Maldives', 'Male', 'Sri Lanka', 'Colombo', 'Kandy', 'Bentota', 'Mauritius', 'Seychelles', 'Reunion', 'Paris',
  'London', 'Edinburgh', 'Rome', 'Venice', 'Florence', 'Milan', 'Amsterdam', 'Switzerland', 'Zurich', 'Interlaken',
  'Lucerne', 'Austria', 'Vienna', 'Salzburg', 'Prague', 'Budapest', 'Barcelona', 'Madrid', 'Lisbon', 'Athens',
  'Santorini', 'Mykonos', 'Copenhagen', 'Oslo', 'Stockholm', 'Helsinki', 'Reykjavik', 'New York', 'Los Angeles', 'San Francisco',
  'Las Vegas', 'Miami', 'Orlando', 'Toronto', 'Vancouver', 'Mexico City', 'Cancun', 'Sydney', 'Melbourne', 'Gold Coast',
  'Auckland', 'Queenstown', 'Tokyo', 'Osaka', 'Kyoto', 'Seoul', 'Hong Kong', 'Beijing', 'Shanghai', 'Manila',
  'Cebu', 'Ho Chi Minh City', 'Hanoi', 'Siem Reap', 'Nairobi', 'Cape Town', 'Johannesburg', 'Zanzibar', 'Cairo', 'Marrakech',
]

const html = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
const slugify = (value) => String(value).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const titleCase = (value) => value.replace(/\b\w/g, (char) => char.toUpperCase())

const groups = [
  { key: 'hyderabad', label: 'Hyderabad localities', region: 'Hyderabad, Telangana', entries: hyderabad, kind: 'locality' },
  { key: 'west-india', label: 'West India cities and destinations', region: 'West India', entries: westIndia, kind: 'region' },
  { key: 'india', label: 'India destinations', region: 'India', entries: india, kind: 'destination' },
  { key: 'world', label: 'International destinations', region: 'Worldwide', entries: world, kind: 'international' },
]

const locations = groups.flatMap((group) => group.entries.map((name, index) => ({
  name,
  group: group.key,
  groupLabel: group.label,
  region: group.region,
  kind: group.kind,
  index,
  slug: slugify(`travel-agency-software-${name}`),
})))

if (locations.length !== 400) throw new Error(`Expected 400 SEO pages, found ${locations.length}`)
if (new Set(locations.map((item) => item.slug)).size !== locations.length) throw new Error('SEO slugs must be unique')

const pageTitle = (item) => item.kind === 'locality'
  ? `Travel Agency Software in ${item.name}, Hyderabad | Wandra`
  : `Travel Agency Software for ${item.name} | Wandra`

const pageDescription = (item) => item.kind === 'locality'
  ? `Run your travel agency in ${item.name}, Hyderabad with Wandra CRM. Manage enquiries, day-wise itineraries, hotels, transport, invoices and payments in one workspace.`
  : `Wandra helps travel agencies serving ${item.name} manage enquiries, itineraries, bookings, hotels, transport, invoices and payments in one connected workspace.`

const pageIntro = (item) => item.kind === 'locality'
  ? `Travel teams in ${item.name} need fast follow-up, clear trip plans and a reliable way to keep supplier and customer details together. Wandra brings that daily work into one travel agency CRM built for the way agencies operate in Hyderabad.`
  : `Travel businesses serving ${item.name} can keep the full trip journey in one place with Wandra. From the first enquiry to the final payment, your team can work from connected client, itinerary, booking and invoice records.`

const useCases = (item) => item.kind === 'locality'
  ? [`Capture and assign enquiries from ${item.name}`, `Build Hyderabad itineraries with hotel, cab and activity options`, `Share branded quotes and WhatsApp-ready trip plans`, `Track payment status before and during every journey`]
  : [`Organise enquiries for ${item.name} trips`, `Build destination plans with supplier details and selling prices`, `Send professional quotes, vouchers and invoices`, `Track bookings, balances and follow-ups from one dashboard`]

const faqs = (item) => [
  [`What does travel agency software for ${item.name} include?`, `Wandra combines CRM, itinerary building, hotel and transport planning, bookings, vouchers, invoices, payment tracking and follow-up in one workspace.`],
  [`Can a team in ${item.name} use Wandra for different destinations?`, `Yes. Your team can build trips for ${item.name} as well as domestic and international destinations using the same connected master data and workflow.`],
  ['Can we see the product before starting?', 'Yes. Book a demo and the Wandra team will walk through the workflow around your agency process.'],
]

const styles = `
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111113;background:#fff}
*{box-sizing:border-box}body{margin:0;line-height:1.55}a{color:inherit}.wrap{width:min(1120px,calc(100% - 40px));margin:0 auto}.top{border-bottom:1px solid #e8e8ec;background:#fff}.nav{height:72px;display:flex;align-items:center;justify-content:space-between;gap:24px}.brand{font-weight:850;letter-spacing:.08em;font-size:16px;text-decoration:none}.brand small{display:block;font-size:7px;letter-spacing:.18em;font-weight:700}.navlinks{display:flex;gap:20px;color:#5f626b;font-size:13px}.navlinks a{text-decoration:none}.navlinks a:hover{text-decoration:underline}.nav-cta{display:flex;gap:9px;align-items:center}.button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 16px;border:1px solid #111113;border-radius:999px;font-size:13px;font-weight:750;text-decoration:none}.button.dark{background:#111113;color:#fff}.button.light{background:#fff}.crumbs{padding:24px 0 0;color:#70737d;font-size:12px}.crumbs a{text-decoration:none}.hero{padding:34px 0 56px;max-width:820px}.eyebrow{display:inline-flex;padding:6px 10px;border:1px solid #dedee4;border-radius:999px;color:#5e616a;font-size:11px;font-weight:750;text-transform:uppercase;letter-spacing:.07em}.hero h1{font-size:clamp(36px,5vw,62px);line-height:1.02;letter-spacing:-.04em;margin:20px 0 18px;max-width:800px}.hero p{font-size:18px;color:#60636c;max-width:700px;margin:0}.hero-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:26px}.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:28px}.fact{padding:18px;border:1px solid #e3e3e8;border-radius:10px;background:#fafafa}.fact strong{display:block;font-size:15px}.fact span{display:block;margin-top:6px;color:#6b6e77;font-size:12px}.section{padding:58px 0;border-top:1px solid #e8e8ec}.section h2{font-size:30px;line-height:1.1;letter-spacing:-.025em;margin:0 0 12px}.section-intro{color:#60636c;max-width:680px}.usecases{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:24px}.usecase{padding:18px;border:1px solid #e3e3e8;border-radius:9px}.usecase b{font-size:13px}.usecase p{margin:5px 0 0;color:#696c75;font-size:12px}.workflow{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:24px}.workflow div{padding:18px;background:#111113;color:#fff;border-radius:9px}.workflow span{display:block;color:#a8a8b0;font-size:11px}.workflow strong{display:block;margin-top:6px;font-size:14px}.faq{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px}.faq article{padding:18px;border-top:2px solid #111113;background:#fafafa}.faq h3{font-size:14px;margin:0}.faq p{font-size:12px;color:#686b74;margin:8px 0 0}.related{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:20px}.related a{padding:14px;border:1px solid #e3e3e8;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700}.related a:hover{border-color:#111113}.bottom{padding:38px 0 56px;border-top:1px solid #e8e8ec}.bottom-inner{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}.muted{color:#777a83;font-size:12px}.footer{background:#0b0b0c;color:#fff;padding:30px 0}.footer-inner{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap}.footer a{color:#c9c9ce;text-decoration:none;font-size:12px}.footer a:hover{text-decoration:underline}.footer p{color:#9a9aa2;font-size:12px;margin:5px 0 0}@media(max-width:700px){.navlinks{display:none}.facts,.usecases,.faq{grid-template-columns:1fr}.workflow{grid-template-columns:1fr 1fr}.hero h1{font-size:40px}.wrap{width:min(100% - 28px,1120px)}}`

const page = (item, related) => {
  const title = pageTitle(item)
  const description = pageDescription(item)
  const questions = faqs(item)
  const canonical = `${siteUrl}/seo/${item.slug}/`
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', name: title, description, url: canonical, isPartOf: { '@type': 'WebSite', name: 'Wandra', url: siteUrl } },
      { '@type': 'SoftwareApplication', name: 'Wandra Travel Agency CRM', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: siteUrl, offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' } },
      { '@type': 'FAQPage', mainEntity: questions.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) },
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Wandra', item: siteUrl }, { '@type': 'ListItem', position: 2, name: 'Travel software pages', item: `${siteUrl}/seo/` }, { '@type': 'ListItem', position: 3, name: item.name, item: canonical }] },
    ],
  }
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${html(title)}</title><meta name="description" content="${html(description)}"><link rel="canonical" href="${html(canonical)}"><meta property="og:title" content="${html(title)}"><meta property="og:description" content="${html(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${html(canonical)}"><link rel="stylesheet" href="/seo/seo.css"><script type="application/ld+json">${JSON.stringify(schema)}</script></head><body><header class="top"><div class="wrap nav"><a class="brand" href="/">WANDRA<small>TRAVEL SOFTWARE</small></a><nav class="navlinks" aria-label="Primary"><a href="/#product">Product</a><a href="/#features">Features</a><a href="/#pricing">Pricing</a><a href="/seo/">All locations</a></nav><div class="nav-cta"><a class="button light" href="/login">Log in</a><a class="button dark" href="/#demo">Book a demo</a></div></div></header><main><div class="wrap"><div class="crumbs"><a href="/">Wandra</a> / <a href="/seo/">Travel software pages</a> / ${html(item.name)}</div><section class="hero"><span class="eyebrow">${html(item.groupLabel)}</span><h1>${html(title.replace(' | Wandra', ''))}</h1><p>${html(pageIntro(item))}</p><div class="hero-actions"><a class="button dark" href="/#demo">Book a demo</a><a class="button light" href="/#pricing">See plans</a></div><div class="facts"><div class="fact"><strong>One workspace</strong><span>CRM, trip plans, bookings and payments connected.</span></div><div class="fact"><strong>Built for travel</strong><span>Hotels, rooms, cabs, activities, vouchers and invoices.</span></div><div class="fact"><strong>Ready to share</strong><span>Branded PDFs, WhatsApp messages and customer updates.</span></div></div></section><section class="section"><h2>Run every ${html(item.name)} trip from one workspace.</h2><p class="section-intro">${html(pageIntro(item))} Wandra gives owners and teams a clear operating view without forcing travel workflows into a generic sales tool.</p><div class="usecases">${useCases(item).map((useCase, index) => `<article class="usecase"><b>${index + 1}. ${html(useCase)}</b><p>Keep the details, next action and customer context attached to the same trip record.</p></article>`).join('')}</div></section><section class="section"><h2>From first enquiry to final payment</h2><p class="section-intro">A practical workflow for travel agencies serving ${html(item.name)} and the destinations around it.</p><div class="workflow"><div><span>01</span><strong>Capture enquiries</strong></div><div><span>02</span><strong>Build the itinerary</strong></div><div><span>03</span><strong>Confirm and voucher</strong></div><div><span>04</span><strong>Invoice and follow up</strong></div></div></section><section class="section"><h2>Questions about Wandra for ${html(item.name)}</h2><div class="faq">${questions.map(([question, answer]) => `<article><h3>${html(question)}</h3><p>${html(answer)}</p></article>`).join('')}</div></section><section class="section"><h2>Explore more travel software pages</h2><p class="section-intro">Compare nearby locations and destination workflows.</p><div class="related">${related.map((entry) => `<a href="/seo/${entry.slug}/">${html(entry.name)} <span aria-hidden="true">→</span></a>`).join('')}</div></section><section class="bottom"><div class="bottom-inner"><div><strong>Make ${html(item.name)} travel operations easier with Wandra.</strong><div class="muted">See the workflow with your team in a live demo.</div></div><a class="button dark" href="/#demo">Book a demo</a></div></section></div></main><footer class="footer"><div class="wrap footer-inner"><div><a class="brand" href="/">WANDRA</a><p>Travel agency CRM, itineraries, bookings and payments.</p></div><div><a href="/seo/">Browse all 400 location pages</a> &nbsp; <a href="/login">Log in</a> &nbsp; <a href="/#demo">Book a demo</a></div></div></footer></body></html>`
}

const indexPage = () => `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Travel Agency Software by City and Destination | Wandra</title><meta name="description" content="Browse Wandra travel agency CRM pages for Hyderabad localities, West India, India destinations and international destinations."><link rel="canonical" href="${siteUrl}/seo/"><link rel="stylesheet" href="/seo/seo.css"></head><body><header class="top"><div class="wrap nav"><a class="brand" href="/">WANDRA<small>TRAVEL SOFTWARE</small></a><nav class="navlinks" aria-label="Primary"><a href="/">Home</a><a href="/#product">Product</a><a href="/#pricing">Pricing</a></nav><div class="nav-cta"><a class="button light" href="/login">Log in</a><a class="button dark" href="/#demo">Book a demo</a></div></div></header><main><div class="wrap"><div class="crumbs"><a href="/">Wandra</a> / Travel software pages</div><section class="hero"><span class="eyebrow">Programmatic SEO directory</span><h1>Travel agency software pages for 400 locations.</h1><p>Explore Wandra CRM workflows for Hyderabad localities, West India, Indian destinations and international markets. Each page explains how travel teams can manage enquiries, itineraries, bookings and payments in one workspace.</p><div class="hero-actions"><a class="button dark" href="/#demo">Book a demo</a><a class="button light" href="/">Back to Wandra</a></div></section>${groups.map((group) => `<section class="section" id="${group.key}"><h2>${html(group.label)}</h2><p class="section-intro">${group.key === 'hyderabad' ? 'Local pages for travel agencies and tour operators across Hyderabad.' : `Location pages for travel businesses serving ${html(group.region)}.`}</p><div class="related">${locations.filter((item) => item.group === group.key).map((item) => `<a href="/seo/${item.slug}/">${html(item.name)} <span aria-hidden="true">→</span></a>`).join('')}</div></section>`).join('')}</div></main><footer class="footer"><div class="wrap footer-inner"><div><a class="brand" href="/">WANDRA</a><p>Travel agency CRM, itineraries, bookings and payments.</p></div><div><a href="/">Home</a> &nbsp; <a href="/#pricing">Pricing</a> &nbsp; <a href="/#demo">Book a demo</a></div></div></footer></body></html>`

await fs.rm(output, { recursive: true, force: true })
await fs.mkdir(output, { recursive: true })
await fs.writeFile(path.join(output, 'seo.css'), styles)
await fs.writeFile(path.join(output, 'index.html'), indexPage())

for (const [index, item] of locations.entries()) {
  const siblings = locations.filter((candidate) => candidate.group === item.group && candidate.slug !== item.slug)
  const related = [siblings[(item.index + 1) % siblings.length], siblings[(item.index + 2) % siblings.length], siblings[(item.index + 3) % siblings.length]].filter(Boolean)
  const dir = path.join(output, item.slug)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, 'index.html'), page(item, related))
  if ((index + 1) % 50 === 0) console.log(`generated ${index + 1}/400 SEO pages`)
}

const urls = [`${siteUrl}/seo/`, ...locations.map((item) => `${siteUrl}/seo/${item.slug}/`)]
const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((url) => `<url><loc>${html(url)}</loc><changefreq>monthly</changefreq><priority>${url.endsWith('/seo/') ? '1.0' : '0.7'}</priority></url>`).join('')}</urlset>`
await fs.writeFile(path.join(root, 'public', 'sitemap.xml'), sitemap)
await fs.writeFile(path.join(root, 'public', 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`)
console.log(`generated ${locations.length} SEO pages plus index, sitemap, and robots.txt`)
