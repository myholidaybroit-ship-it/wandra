// ============================================================
// Seed data modeled on the source demo (Kashmir/India travel agency)
// ============================================================

export const agency = {
  name: 'Wandra Travels',
  legalName: 'Wandra Travels Pvt. Ltd.',
  email: 'hello@wandra.travel',
  phone: '+91 78898 04942',
  website: 'www.wandra.travel',
  address: 'Ghalib Abad, Shaltang, Srinagar, Jammu & Kashmir',
  gstin: '01ABCDE1234F1Z5',
  bank: {
    accountName: 'Wandra Travels',
    bankName: 'J&K Bank',
    accountNumber: '0082040100001735',
    ifsc: 'JAKA0MALROO',
  },
  plan: { name: 'Free', limit: 100 },
}

// stock photo helper — master forms accept any full image URL
const img = (id) => `https://images.unsplash.com/photo-${id}?w=1400&q=72&auto=format&fit=crop`

export const destinations = [
  { id: 'd1', name: 'Srinagar', type: 'Domestic', location: 'Kashmir Valley, J&K', features: 'Dal Lake, Houseboats, Mughal Gardens, Shankaracharya', image: img('1595815771614-ade9d652a65d'), gallery: [img('1493246507139-91e8fad9978e'), img('1439066615861-d1af74d74000')] },
  { id: 'd2', name: 'Gulmarg', type: 'Domestic', location: 'Baramulla, J&K', features: 'Gondola, Skiing, Meadows, Golf course', image: img('1551524559-8af4e6624178'), gallery: [img('1454496522488-7a8e488e8606'), img('1519681393784-d120267933ba')] },
  { id: 'd3', name: 'Pahalgam', type: 'Domestic', location: 'Anantnag, J&K', features: 'Lidder River, Betaab Valley, Aru Valley, Horse riding', image: img('1469474968028-56623f02e42e'), gallery: [img('1464822759023-fed622ff2c3b'), img('1502082553048-f009c37129b9')] },
  { id: 'd4', name: 'Sonamarg', type: 'Domestic', location: 'Ganderbal, J&K', features: 'Thajiwas Glacier, Snow fields, Meadows', image: img('1506905925346-21bda4d32df4'), gallery: [img('1483728642387-6c3bdd6c93e5'), img('1454496522488-7a8e488e8606')] },
  { id: 'd5', name: 'Dal Lake', type: 'Domestic', location: 'Srinagar, J&K', features: 'Shikara ride, Houseboats, Floating market', image: img('1476514525535-07fb3b4ae5f1'), gallery: [img('1439066615861-d1af74d74000'), img('1493246507139-91e8fad9978e')] },
  { id: 'd6', name: 'Kargil', type: 'Domestic', location: 'Ladakh (via Srinagar route)', features: 'Drass War Memorial, Mountain passes', image: img('1544735716-392fe2489ffa'), gallery: [img('1469854523086-cc02fe5d8800'), img('1464822759023-fed622ff2c3b')] },
  { id: 'd7', name: 'Dubai', type: 'International', location: 'United Arab Emirates', features: 'Burj Khalifa, Desert safari, Marina cruise, Shopping', image: img('1512453979798-5ea266f8880c'), gallery: [img('1518684079-3c830dcef090'), img('1508672019048-805c876b67e2')] },
  { id: 'd8', name: 'Thailand', type: 'International', location: 'Bangkok, Phuket, Krabi', features: 'Islands, Temples, Street food, Nightlife', image: img('1552465011-b4e21bf6e79a'), gallery: [img('1528181304800-259b08848526'), img('1507525428034-b723cf961d3e')] },
  { id: 'd9', name: 'Bali', type: 'International', location: 'Indonesia', features: 'Beaches, Rice terraces, Temples, Water sports', image: img('1537996194471-e657df975ab4'), gallery: [img('1512343879784-a960bf40e7f2'), img('1519046904884-53103b34b206')] },
  { id: 'd10', name: 'Maldives', type: 'International', location: 'Indian Ocean', features: 'Water villas, Snorkeling, Honeymoon resorts', image: img('1514282401047-d79a71a590e8'), gallery: [img('1519046904884-53103b34b206'), img('1507525428034-b723cf961d3e')] },
  { id: 'd11', name: 'Kerala', type: 'Domestic', location: 'Munnar, Alleppey, Kochi', features: 'Backwaters, Houseboats, Tea gardens, Ayurveda', image: img('1602216056096-3b40cc0c9944'), gallery: [img('1593693397690-362cb9666fc2'), img('1580619305218-8423a7ef79b4')] },
]

/* ------------------------------------------------------------------
   Package templates — proven itineraries per destination.
   Cloning one pre-fills an entire package in ~60 seconds.
   Each carries a cloneable payload (hotelsAlloc / cabs / categories /
   pricing / itinerary) so computePricing yields a real total.
   ------------------------------------------------------------------ */
const day = (n, title, mealPlan, desc, activities, stopDest, stopAct) => ({
  day: n, title, template: title, mealPlan, description: desc, activities,
  stops: [{ destination: stopDest, date: '', activity: stopAct }], travel: '', notes: '',
})

export const packageTemplates = [
  {
    id: 'tpl-sr1', name: 'Srinagar Serene', destination: 'Srinagar', tag: 'Bestseller',
    nights: 3, days: 4, summary: 'Dal Lake, gardens & a Gulmarg day — the classic first-timer Kashmir trip.',
    highlights: ['Dal Lake Shikara', 'Mughal Gardens', 'Gulmarg Gondola'], priceFrom: 38000, usedCount: 42,
    hotelsAlloc: [
      { night: 1, hotelId: 'h1', name: 'The Lalit Grand Palace', roomType: 'Deluxe', price: 8000, net: 6500 },
      { night: 2, hotelId: 'h2', name: 'Taj Dal View', roomType: 'Superior', price: 7500, net: 6000 },
      { night: 3, hotelId: 'h2', name: 'Taj Dal View', roomType: 'Superior', price: 7500, net: 6000 },
    ],
    cabs: [{ cabId: 'c3', name: 'Toyota Innova', type: 'SUV', km: 350, rate: 25 }],
    categories: [{ name: 'Shikara Ride', description: '1 hr Dal Lake shikara', amount: 1500 }],
    pricing: { mode: 'Total', packageCost: 3000, childCost: 0, discount: 0, gstPercent: 5 },
    itinerary: [
      day(1, 'Arrival in Srinagar', 'Dinner', 'Warm welcome, transfer to hotel and a relaxed evening by Dal Lake.', 'Airport pickup, hotel check-in, evening shikara', 'Dal Lake', 'Shikara ride, houseboats'),
      day(2, 'Gulmarg Gondola Day', 'Breakfast & Dinner', 'Full-day excursion to the meadow of flowers and the famous gondola.', 'Gondola Phase 1 & 2, snow play', 'Gulmarg', 'Gondola, snow activities'),
      day(3, 'Srinagar Sightseeing', 'Breakfast & Dinner', 'Mughal gardens and old-city charm.', 'Nishat, Shalimar, Shankaracharya', 'Srinagar', 'Mughal Gardens'),
      day(4, 'Departure', 'Breakfast', 'Last-minute shopping and airport drop.', 'Check-out, airport drop', 'Srinagar', 'Local shopping'),
    ],
  },
  {
    id: 'tpl-sr2', name: 'Kashmir Grand Luxury', destination: 'Srinagar', tag: 'Luxury',
    nights: 5, days: 6, summary: 'Srinagar, Gulmarg & Pahalgam at a relaxed pace with premium stays.',
    highlights: ['Premium houseboat', 'Betaab Valley', 'Aru Valley', 'Pahalgam'], priceFrom: 78000, usedCount: 18,
    hotelsAlloc: [
      { night: 1, hotelId: 'h1', name: 'The Lalit Grand Palace', roomType: 'Palace Room', price: 14000, net: 11000 },
      { night: 2, hotelId: 'h1', name: 'The Lalit Grand Palace', roomType: 'Palace Room', price: 14000, net: 11000 },
      { night: 3, hotelId: 'h3', name: 'Vivanta Dal View', roomType: 'Premium', price: 12000, net: 9500 },
      { night: 4, hotelId: 'h3', name: 'Vivanta Dal View', roomType: 'Premium', price: 12000, net: 9500 },
      { night: 5, hotelId: 'h2', name: 'Taj Dal View', roomType: 'Suite', price: 13000, net: 10500 },
    ],
    cabs: [{ cabId: 'c4', name: 'Innova Crysta', type: 'SUV', km: 600, rate: 28 }],
    categories: [{ name: 'Shikara Ride', description: 'Sunset shikara', amount: 2000 }, { name: 'Gondola Tickets', description: 'Phase 1 & 2', amount: 3000 }],
    pricing: { mode: 'Total', packageCost: 6000, childCost: 0, discount: 0, gstPercent: 5 },
    itinerary: [
      day(1, 'Arrival & Houseboat', 'Dinner', 'Check into a premium houseboat.', 'Airport pickup, houseboat stay', 'Dal Lake', 'Houseboat, shikara'),
      day(2, 'Gulmarg Excursion', 'Breakfast & Dinner', 'Gondola and alpine meadows.', 'Gondola, snow play', 'Gulmarg', 'Gondola'),
      day(3, 'Drive to Pahalgam', 'Breakfast & Dinner', 'Scenic drive, saffron fields en route.', 'Betaab Valley, Aru Valley', 'Pahalgam', 'Betaab Valley'),
      day(4, 'Pahalgam Leisure', 'Breakfast & Dinner', 'Lidder river and pony rides.', 'Aru, Baisaran', 'Pahalgam', 'Aru Valley'),
      day(5, 'Back to Srinagar', 'Breakfast & Dinner', 'Mughal gardens and shopping.', 'Nishat, Shalimar', 'Srinagar', 'Mughal Gardens'),
      day(6, 'Departure', 'Breakfast', 'Airport drop.', 'Check-out, drop', 'Srinagar', 'Departure'),
    ],
  },
  {
    id: 'tpl-gm1', name: 'Gulmarg Snow Escape', destination: 'Gulmarg', tag: 'Snow',
    nights: 3, days: 4, summary: 'Base at the snow line — gondola, skiing and pure white meadows.',
    highlights: ['Gondola Phase 1 & 2', 'Skiing', 'Snow play'], priceFrom: 34000, usedCount: 27,
    hotelsAlloc: [
      { night: 1, hotelId: '', name: 'The Khyber Himalayan Resort', roomType: 'Deluxe', price: 12000, net: 9500 },
      { night: 2, hotelId: '', name: 'The Khyber Himalayan Resort', roomType: 'Deluxe', price: 12000, net: 9500 },
      { night: 3, hotelId: 'h1', name: 'The Lalit Grand Palace', roomType: 'Deluxe', price: 8000, net: 6500 },
    ],
    cabs: [{ cabId: 'c3', name: 'Toyota Innova', type: 'SUV', km: 250, rate: 25 }],
    categories: [{ name: 'Gondola Tickets', description: 'Phase 1 & 2', amount: 3000 }, { name: 'Ski Instructor', description: 'Half day', amount: 2000 }],
    pricing: { mode: 'Total', packageCost: 3000, childCost: 0, discount: 0, gstPercent: 5 },
    itinerary: [
      day(1, 'Arrival & Drive to Gulmarg', 'Dinner', 'Transfer to Gulmarg resort.', 'Check-in, evening snow walk', 'Gulmarg', 'Snow meadows'),
      day(2, 'Gondola & Skiing', 'Breakfast & Dinner', 'Full snow day.', 'Gondola, skiing lesson', 'Gulmarg', 'Gondola, skiing'),
      day(3, 'Srinagar & Dal Lake', 'Breakfast & Dinner', 'Shikara and gardens.', 'Shikara, Mughal Gardens', 'Srinagar', 'Dal Lake'),
      day(4, 'Departure', 'Breakfast', 'Airport drop.', 'Check-out, drop', 'Srinagar', 'Departure'),
    ],
  },
  {
    id: 'tpl-ph1', name: 'Pahalgam Valley Retreat', destination: 'Pahalgam', tag: 'Family',
    nights: 4, days: 5, summary: 'Rivers, valleys and pony trails — the calm, green side of Kashmir.',
    highlights: ['Betaab Valley', 'Aru Valley', 'Lidder River', 'Baisaran'], priceFrom: 46000, usedCount: 15,
    hotelsAlloc: [
      { night: 1, hotelId: 'h2', name: 'Taj Dal View', roomType: 'Superior', price: 7500, net: 6000 },
      { night: 2, hotelId: '', name: 'Pahalgam Grand', roomType: 'Deluxe', price: 8000, net: 6500 },
      { night: 3, hotelId: '', name: 'Pahalgam Grand', roomType: 'Deluxe', price: 8000, net: 6500 },
      { night: 4, hotelId: 'h2', name: 'Taj Dal View', roomType: 'Superior', price: 7500, net: 6000 },
    ],
    cabs: [{ cabId: 'c3', name: 'Toyota Innova', type: 'SUV', km: 450, rate: 25 }],
    categories: [{ name: 'Pony Ride', description: 'Baisaran valley', amount: 2000 }],
    pricing: { mode: 'Total', packageCost: 4000, childCost: 0, discount: 0, gstPercent: 5 },
    itinerary: [
      day(1, 'Arrival in Srinagar', 'Dinner', 'Welcome and Dal Lake evening.', 'Pickup, shikara', 'Srinagar', 'Dal Lake'),
      day(2, 'Drive to Pahalgam', 'Breakfast & Dinner', 'Saffron fields en route.', 'Betaab, Chandanwari', 'Pahalgam', 'Betaab Valley'),
      day(3, 'Pahalgam Valleys', 'Breakfast & Dinner', 'Aru and Baisaran.', 'Aru Valley, pony ride', 'Pahalgam', 'Aru Valley'),
      day(4, 'Return to Srinagar', 'Breakfast & Dinner', 'Gardens and shopping.', 'Mughal Gardens', 'Srinagar', 'Mughal Gardens'),
      day(5, 'Departure', 'Breakfast', 'Airport drop.', 'Check-out, drop', 'Srinagar', 'Departure'),
    ],
  },
  {
    id: 'tpl-sm1', name: 'Sonamarg Glacier Trail', destination: 'Sonamarg', tag: 'Short',
    nights: 2, days: 3, summary: 'A crisp 2-night glacier getaway — perfect weekend Kashmir.',
    highlights: ['Thajiwas Glacier', 'Snow fields', 'Meadows'], priceFrom: 24000, usedCount: 9,
    hotelsAlloc: [
      { night: 1, hotelId: 'h2', name: 'Taj Dal View', roomType: 'Superior', price: 7500, net: 6000 },
      { night: 2, hotelId: 'h1', name: 'The Lalit Grand Palace', roomType: 'Deluxe', price: 8000, net: 6500 },
    ],
    cabs: [{ cabId: 'c1', name: 'Swift Dzire', type: 'Sedan', km: 220, rate: 20 }],
    categories: [{ name: 'Pony Ride', description: 'Thajiwas glacier', amount: 1500 }],
    pricing: { mode: 'Total', packageCost: 2000, childCost: 0, discount: 0, gstPercent: 5 },
    itinerary: [
      day(1, 'Arrival & Sonamarg Drive', 'Dinner', 'Scenic drive to the meadow of gold.', 'Pickup, drive to Sonamarg', 'Sonamarg', 'Meadows'),
      day(2, 'Thajiwas Glacier', 'Breakfast & Dinner', 'Pony ride to the glacier.', 'Thajiwas glacier, snow play', 'Sonamarg', 'Thajiwas Glacier'),
      day(3, 'Departure', 'Breakfast', 'Return and airport drop.', 'Check-out, drop', 'Srinagar', 'Departure'),
    ],
  },
  {
    id: 'tpl-db1', name: 'Dubai Highlights', destination: 'Dubai', tag: 'Bestseller',
    nights: 4, days: 5, summary: 'Burj Khalifa, desert safari and a marina cruise — Dubai’s greatest hits.',
    highlights: ['Burj Khalifa', 'Desert Safari', 'Marina Cruise', 'Abu Dhabi'], priceFrom: 65000, usedCount: 33,
    hotelsAlloc: [
      { night: 1, hotelId: '', name: 'Rove Downtown', roomType: 'Deluxe', price: 12000, net: 9500 },
      { night: 2, hotelId: '', name: 'Rove Downtown', roomType: 'Deluxe', price: 12000, net: 9500 },
      { night: 3, hotelId: '', name: 'Rove Downtown', roomType: 'Deluxe', price: 12000, net: 9500 },
      { night: 4, hotelId: '', name: 'Rove Downtown', roomType: 'Deluxe', price: 12000, net: 9500 },
    ],
    cabs: [{ cabId: '', name: 'Private Transfer', type: 'Sedan', km: 300, rate: 30 }],
    categories: [{ name: 'Burj Khalifa 124F', description: 'Skip-the-line', amount: 6000 }, { name: 'Desert Safari', description: 'BBQ dinner + show', amount: 5000 }, { name: 'Marina Dhow Cruise', description: 'Dinner cruise', amount: 4000 }],
    pricing: { mode: 'Total', packageCost: 8000, childCost: 0, discount: 0, gstPercent: 5 },
    itinerary: [
      day(1, 'Arrival in Dubai', 'Dinner', 'Airport pickup and check-in.', 'Transfer, marina walk', 'Dubai', 'Dubai Marina'),
      day(2, 'City Tour & Burj Khalifa', 'Breakfast', 'Old & new Dubai plus the tower.', 'City tour, Burj Khalifa', 'Downtown Dubai', 'Burj Khalifa'),
      day(3, 'Desert Safari', 'Breakfast & Dinner', 'Dune bashing and BBQ.', 'Desert safari, belly dance', 'Dubai Desert', 'Desert Safari'),
      day(4, 'Abu Dhabi Day Trip', 'Breakfast', 'Grand Mosque and Ferrari World.', 'Sheikh Zayed Mosque', 'Abu Dhabi', 'Grand Mosque'),
      day(5, 'Departure', 'Breakfast', 'Airport drop.', 'Check-out, drop', 'Dubai', 'Departure'),
    ],
  },
  {
    id: 'tpl-th1', name: 'Thailand Islands', destination: 'Thailand', tag: 'Beach',
    nights: 5, days: 6, summary: 'Bangkok city buzz plus Phuket & Krabi island hopping.',
    highlights: ['Phi Phi Islands', 'James Bond Island', 'Bangkok temples', 'Beaches'], priceFrom: 72000, usedCount: 21,
    hotelsAlloc: [
      { night: 1, hotelId: '', name: 'Bangkok Riverside', roomType: 'Deluxe', price: 9000, net: 7200 },
      { night: 2, hotelId: '', name: 'Bangkok Riverside', roomType: 'Deluxe', price: 9000, net: 7200 },
      { night: 3, hotelId: '', name: 'Phuket Beachfront', roomType: 'Sea View', price: 11000, net: 8800 },
      { night: 4, hotelId: '', name: 'Phuket Beachfront', roomType: 'Sea View', price: 11000, net: 8800 },
      { night: 5, hotelId: '', name: 'Phuket Beachfront', roomType: 'Sea View', price: 11000, net: 8800 },
    ],
    cabs: [{ cabId: '', name: 'Private Van', type: 'Van', km: 200, rate: 35 }],
    categories: [{ name: 'Phi Phi Speedboat', description: 'Full day tour', amount: 6000 }, { name: 'James Bond Island', description: 'Canoe tour', amount: 5000 }],
    pricing: { mode: 'Total', packageCost: 7000, childCost: 0, discount: 0, gstPercent: 5 },
    itinerary: [
      day(1, 'Arrival in Bangkok', 'Dinner', 'Check-in and riverside evening.', 'Transfer, Asiatique', 'Bangkok', 'Riverside'),
      day(2, 'Bangkok City & Temples', 'Breakfast', 'Grand Palace and markets.', 'Grand Palace, Wat Arun', 'Bangkok', 'Temples'),
      day(3, 'Fly to Phuket', 'Breakfast', 'Island transfer and beach.', 'Flight, beach evening', 'Phuket', 'Patong Beach'),
      day(4, 'Phi Phi Islands', 'Breakfast', 'Speedboat island tour.', 'Phi Phi, Maya Bay', 'Phi Phi', 'Island hopping'),
      day(5, 'James Bond Island', 'Breakfast', 'Canoe through limestone karsts.', 'Phang Nga Bay', 'Krabi', 'James Bond Island'),
      day(6, 'Departure', 'Breakfast', 'Airport drop.', 'Check-out, drop', 'Phuket', 'Departure'),
    ],
  },
  {
    id: 'tpl-bl1', name: 'Bali Honeymoon', destination: 'Bali', tag: 'Honeymoon',
    nights: 5, days: 6, summary: 'Rice terraces, temples and a private-pool villa — made for two.',
    highlights: ['Private Pool Villa', 'Ubud Rice Terraces', 'Uluwatu Temple', 'Nusa Penida'], priceFrom: 88000, usedCount: 24,
    hotelsAlloc: [
      { night: 1, hotelId: '', name: 'Ubud Jungle Villa', roomType: 'Pool Villa', price: 14000, net: 11000 },
      { night: 2, hotelId: '', name: 'Ubud Jungle Villa', roomType: 'Pool Villa', price: 14000, net: 11000 },
      { night: 3, hotelId: '', name: 'Seminyak Beach Resort', roomType: 'Ocean Suite', price: 15000, net: 12000 },
      { night: 4, hotelId: '', name: 'Seminyak Beach Resort', roomType: 'Ocean Suite', price: 15000, net: 12000 },
      { night: 5, hotelId: '', name: 'Seminyak Beach Resort', roomType: 'Ocean Suite', price: 15000, net: 12000 },
    ],
    cabs: [{ cabId: '', name: 'Private Car', type: 'Sedan', km: 250, rate: 32 }],
    categories: [{ name: 'Nusa Penida Tour', description: 'Full-day island', amount: 6000 }, { name: 'Candle-light Dinner', description: 'Beachfront', amount: 4000 }],
    pricing: { mode: 'Total', packageCost: 8000, childCost: 0, discount: 0, gstPercent: 5 },
    itinerary: [
      day(1, 'Arrival in Bali', 'Dinner', 'Villa check-in and welcome.', 'Transfer, villa', 'Ubud', 'Jungle villa'),
      day(2, 'Ubud & Rice Terraces', 'Breakfast', 'Tegallalang and swings.', 'Rice terrace, Monkey Forest', 'Ubud', 'Rice Terraces'),
      day(3, 'Move to Seminyak', 'Breakfast', 'Beach resort and sunset.', 'Transfer, beach', 'Seminyak', 'Beach'),
      day(4, 'Nusa Penida Tour', 'Breakfast', 'Kelingking and beaches.', 'Nusa Penida boat tour', 'Nusa Penida', 'Kelingking Beach'),
      day(5, 'Uluwatu & Dinner', 'Breakfast & Dinner', 'Temple and candle-light dinner.', 'Uluwatu, Kecak dance', 'Uluwatu', 'Uluwatu Temple'),
      day(6, 'Departure', 'Breakfast', 'Airport drop.', 'Check-out, drop', 'Bali', 'Departure'),
    ],
  },
  {
    id: 'tpl-mv1', name: 'Maldives Water Villa', destination: 'Maldives', tag: 'Luxury',
    nights: 4, days: 5, summary: 'Overwater villa, snorkeling and total switch-off in the Indian Ocean.',
    highlights: ['Overwater Villa', 'Snorkeling', 'Sandbank Picnic', 'Sunset Cruise'], priceFrom: 135000, usedCount: 12,
    hotelsAlloc: [
      { night: 1, hotelId: '', name: 'Adaaran Water Villa', roomType: 'Overwater Villa', price: 28000, net: 23000 },
      { night: 2, hotelId: '', name: 'Adaaran Water Villa', roomType: 'Overwater Villa', price: 28000, net: 23000 },
      { night: 3, hotelId: '', name: 'Adaaran Water Villa', roomType: 'Overwater Villa', price: 28000, net: 23000 },
      { night: 4, hotelId: '', name: 'Adaaran Water Villa', roomType: 'Overwater Villa', price: 28000, net: 23000 },
    ],
    cabs: [{ cabId: '', name: 'Speedboat Transfer', type: 'Boat', km: 0, rate: 0, total: 12000 }],
    categories: [{ name: 'Speedboat Transfers', description: 'Airport ⇄ resort', amount: 12000 }, { name: 'Sandbank Picnic', description: 'Private', amount: 8000 }, { name: 'Sunset Cruise', description: 'Dolphin watch', amount: 6000 }],
    pricing: { mode: 'Total', packageCost: 5000, childCost: 0, discount: 0, gstPercent: 5 },
    itinerary: [
      day(1, 'Arrival & Speedboat', 'All meals', 'Transfer to the overwater villa.', 'Speedboat, villa check-in', 'Maldives', 'Overwater villa'),
      day(2, 'Snorkeling & Reef', 'All meals', 'House reef and marine life.', 'Snorkeling, kayak', 'Maldives', 'House reef'),
      day(3, 'Sandbank Picnic', 'All meals', 'Private sandbank day.', 'Sandbank picnic, swim', 'Maldives', 'Sandbank'),
      day(4, 'Sunset Cruise', 'All meals', 'Dolphin-watch cruise.', 'Sunset cruise', 'Maldives', 'Sunset cruise'),
      day(5, 'Departure', 'Breakfast', 'Speedboat and airport.', 'Check-out, transfer', 'Maldives', 'Departure'),
    ],
  },
]

export const hotels = [
  { id: 'h1', name: 'The Lalit Grand Palace', city: 'Srinagar', phone: '+91 194 250 1001', email: 'res@lalitsrinagar.com', rating: 5, buyingPrice: 18000, extraBedAdult: 7000, extraBedChild: 4500, childNoBed: 2500, roomTypes: 'Deluxe, Palace Room, Suite', description: 'Heritage palace hotel overlooking Dal Lake.', image: img('1524492412937-b28074a5d7da') },
  { id: 'h2', name: 'Taj Dal View', city: 'Srinagar', phone: '+91 194 246 1234', email: 'res@tajdalview.com', rating: 5, buyingPrice: 20000, extraBedAdult: 8000, extraBedChild: 5000, childNoBed: 3000, roomTypes: 'Superior, Deluxe, Suite', description: 'Luxury hotel with panoramic lake views.', image: img('1520250497591-112f2f40a3f4') },
  { id: 'h3', name: 'Vivanta Dal View', city: 'Srinagar', phone: '+91 194 246 5555', email: 'res@vivanta.com', rating: 5, buyingPrice: 16000, extraBedAdult: 6500, extraBedChild: 4000, childNoBed: 2500, roomTypes: 'Deluxe, Premium', description: 'Hill-top luxury overlooking the valley.', image: img('1566073771259-6a8506099945') },
  { id: 'h4', name: 'Radisson Collection Hotel & Spa', city: 'Srinagar', phone: '+91 194 240 0000', email: 'res@radisson.com', rating: 5, buyingPrice: 15000, extraBedAdult: 6000, extraBedChild: 3800, childNoBed: 2200, roomTypes: 'Superior, Suite', description: 'Modern spa hotel near city centre.', image: img('1571896349842-33c89424de2d') },
  { id: 'h5', name: 'Hotel Comrade Inn', city: 'Gulmarg', phone: '+91 195 425 4321', email: 'stay@comradeinn.com', rating: 4, buyingPrice: 9000, extraBedAdult: 3500, extraBedChild: 2200, childNoBed: 1200, roomTypes: 'Standard, Deluxe', description: 'Cozy stay close to the Gondola.', image: img('1582719508461-905c673771fd') },
  { id: 'h6', name: 'The Khyber Himalayan Resort & Spa', city: 'Gulmarg', phone: '+91 195 425 6666', email: 'res@khyber.com', rating: 5, buyingPrice: 24000, extraBedAdult: 9500, extraBedChild: 6000, childNoBed: 3500, roomTypes: 'Deluxe, Suite, Cottage', description: 'Premier alpine luxury resort.', image: img('1602216056096-3b40cc0c9944') },
  { id: 'h7', name: 'Houseboat Young Bombay', city: 'Srinagar', phone: '+91 990 600 1122', email: 'youngbombay@dal.com', rating: 4, buyingPrice: 8000, extraBedAdult: 3000, extraBedChild: 2000, childNoBed: 1000, roomTypes: 'Deluxe Houseboat', description: 'Classic Dal Lake houseboat experience.', image: img('1476514525535-07fb3b4ae5f1') },
]

// Master data: transport service locations / routes (drive the builder's "Service location" + "Service type")
export const serviceLocations = [
  { id: 'sl1', name: 'Airport to Hotel', serviceType: 'Arrival Transfer', durationMins: 60, cost: 1200, sell: 1600, city: 'Srinagar' },
  { id: 'sl2', name: 'Hotel to Airport', serviceType: 'Departure Transfer', durationMins: 60, cost: 1200, sell: 1600, city: 'Srinagar' },
  { id: 'sl3', name: 'Srinagar Local Sightseeing', serviceType: 'Sightseeing', durationMins: 480, cost: 3200, sell: 4200, city: 'Srinagar' },
  { id: 'sl4', name: 'Gulmarg Day Excursion', serviceType: 'Excursion', durationMins: 600, cost: 4200, sell: 5500, city: 'Gulmarg' },
  { id: 'sl5', name: 'Pahalgam Day Trip', serviceType: 'Full-day Transfer', durationMins: 600, cost: 4200, sell: 5500, city: 'Pahalgam' },
  { id: 'sl6', name: 'Sonamarg Day Trip', serviceType: 'Excursion', durationMins: 600, cost: 4200, sell: 5500, city: 'Sonamarg' },
  { id: 'sl7', name: 'Srinagar → Gulmarg (Intercity)', serviceType: 'Intercity Transfer', durationMins: 120, cost: 2200, sell: 3000, city: 'Gulmarg' },
  { id: 'sl8', name: 'Srinagar → Pahalgam (Intercity)', serviceType: 'Intercity Transfer', durationMins: 150, cost: 2600, sell: 3400, city: 'Pahalgam' },
]

// Master data: activities / tickets with cost & selling price (drive the builder's "Activity/ticket name" + "Category")
export const activities = [
  { id: 'ac1', name: 'Shikara Ride — Dal Lake', category: 'Boat Ride', durationMins: 60, cost: 1200, sell: 1500, city: 'Srinagar', description: 'A one-hour traditional shikara ride across the Dal Lake, gliding past floating gardens, houseboats and the Char Chinar island at a relaxed pace.', image: img('1476514525535-07fb3b4ae5f1') },
  { id: 'ac2', name: 'Gulmarg Gondola — Phase 1 & 2', category: 'Cable Car', durationMins: 180, cost: 2400, sell: 3000, city: 'Gulmarg', description: 'Ride the famous Gulmarg Gondola across both phases up to Apharwat peak for sweeping views of snow-clad meadows and the Pir Panjal range.', image: img('1551524559-8af4e6624178') },
  { id: 'ac3', name: 'Mughal Gardens Entry', category: 'Entry Ticket', durationMins: 120, cost: 200, sell: 400, city: 'Srinagar', description: 'Entry to the terraced Mughal-era gardens — Nishat, Shalimar and Chashme Shahi — laid out with fountains, chinar trees and lake views.', image: img('1441974231531-c6227db76b6e') },
  { id: 'ac4', name: 'Betaab Valley Entry', category: 'Entry Ticket', durationMins: 90, cost: 150, sell: 300, city: 'Pahalgam', description: 'Visit the lush Betaab Valley framed by pine forests and snow peaks, with the Lidder river running through — a classic Pahalgam stop.', image: img('1469474968028-56623f02e42e') },
  { id: 'ac5', name: 'Skiing Lesson (Half Day)', category: 'Adventure', durationMins: 240, cost: 1800, sell: 2500, city: 'Gulmarg', description: 'A half-day beginner skiing session on Gulmarg’s slopes with gear and an instructor included — perfect for a first taste of the snow.', image: img('1506905925346-21bda4d32df4') },
  { id: 'ac6', name: 'Wazwan Dinner Experience', category: 'Meal', durationMins: 120, cost: 900, sell: 1500, city: 'Srinagar', description: 'A traditional multi-course Kashmiri Wazwan dinner featuring rogan josh, gushtaba and more, served in authentic style.', image: img('1414235077428-338989a2e8c0') },
  { id: 'ac7', name: 'Thajiwas Glacier Pony Ride', category: 'Adventure', durationMins: 120, cost: 700, sell: 1200, city: 'Sonamarg', description: 'A guided pony ride from Sonamarg up to the Thajiwas glacier, with meadows and snow bridges along the trail.', image: img('1601050690597-df0568f70950') },
]

export const cabs = [
  { id: 'c1', name: 'Swift Dzire', type: 'Sedan', acType: 'AC', capacity: 4, ratePerKm: 20, ratePerDay: 2600, image: img('1549317661-bd32c8ce0db2'), contact: '+91 98765 11111', status: 'Active' },
  { id: 'c2', name: 'Toyota Etios', type: 'Sedan', acType: 'AC', capacity: 3, ratePerKm: 20, ratePerDay: 2400, image: img('1502877338535-766e1452684a'), contact: '+91 98765 22222', status: 'Active' },
  { id: 'c3', name: 'Toyota Innova', type: 'SUV', acType: 'AC', capacity: 6, ratePerKm: 25, ratePerDay: 3800, image: img('1533473359331-0135ef1b58bf'), contact: '+91 98765 33333', status: 'Active' },
  { id: 'c4', name: 'Innova Crysta', type: 'SUV', acType: 'AC', capacity: 6, ratePerKm: 28, ratePerDay: 4400, image: img('1494976388531-d1058494cdd8'), contact: '+91 98765 44444', status: 'Active' },
  { id: 'c5', name: 'Tempo Traveller 12 Seater', type: 'Tempo Traveller', acType: 'AC', capacity: 12, ratePerKm: 40, ratePerDay: 7500, image: img('1519641471654-76ce0107ad1b'), contact: '+91 98765 55555', status: 'Active' },
  { id: 'c6', name: 'Tempo Traveller 17 Seater', type: 'Tempo Traveller', acType: 'AC', capacity: 17, ratePerKm: 48, ratePerDay: 9000, image: img('1571068316344-75bc76f77890'), contact: '+91 98765 66666', status: 'Active' },
]

export const clients = [
  { id: 'cl1', code: 'CLI-202602-001', name: 'Zubair', email: 'zubair@gmail.com', phone: '8009144592', address: 'Ghalib Abad Shaltang Srinagar', city: 'Srinagar', state: 'J&K', country: 'India', tripStatus: 'Converted', note: 'Advance received', interest: 'Srinagar, Gulmarg', budget: 90000, source: 'Referral', createdAt: '2026-02-12', query: { assignee: 'Wandra Admin', refId: '4FQ9X2', startDate: '2026-02-28', nights: 3, adults: 4, children: 0 } },
  { id: 'cl2', code: 'CLI-202602-002', name: 'Mr Zahid', email: 'zahidnazir330@gmail.com', phone: '8899144592', address: 'Lal Chowk, Srinagar', city: 'Srinagar', state: 'J&K', country: 'India', tripStatus: 'In Progress', note: 'Ready to book', interest: 'Gulmarg', budget: 45000, source: 'Ad Form', createdAt: '2026-02-18', query: { assignee: 'Aamir Sales', refId: 'K8M2Q7', startDate: '2026-03-06', nights: 2, adults: 2, children: 1 } },
]

export const itineraryTemplates = [
  { id: 't1', name: 'Arrival in Srinagar', mealPlan: 'Dinner', activity: 'Shikara ride, Houseboats, Floating market', description: 'Arrival in the heart of Kashmir, warm welcome with scenic views.' },
  { id: 't2', name: 'Mountain Escape Journey', mealPlan: 'Breakfast & Dinner', activity: 'Thajiwas Glacier, Snow fields, Meadows', description: 'A scenic drive through historic mountains and cultural landmarks.' },
  { id: 't3', name: 'Gulmarg Gondola Day', mealPlan: 'Breakfast & Dinner', activity: 'Gondola Phase 1 & 2, Snow activities', description: 'Cable car to the snow line with panoramic alpine views.' },
]

export const inclusionPresets = {
  inclusions: ['Accommodation as per itinerary', 'Daily breakfast & dinner', 'All transfers by private cab', 'Welcome drink on arrival', 'Driver allowance, tolls & parking', 'All sightseeing as per itinerary', 'Airport pickup & drop', 'All applicable hotel taxes', 'English-speaking driver / guide support', '24×7 on-trip support'],
  exclusions: ['Airfare / train fare', 'Lunch & personal expenses', 'Gondola / activity tickets unless specified', 'Travel insurance', 'Anything not mentioned in inclusions', 'GST & TCS as applicable', 'Early check-in / late check-out', 'Monument & park entry fees', 'Tips, porterage & laundry'],
}

export const categoryGroups = [
  'Meals', 'Hotel Policies', 'Services & Support', 'Visa & Drinks',
  'Transportation', 'Insurance & Medical', 'Personal Expenses', 'Policy / Cancellation', 'Travel Costs',
]

/* ------------------------------------------------------------------
   Lead-capture landing page — default config for the builder.
   Section order is drag-reorderable; colors/copy fully editable.
   ------------------------------------------------------------------ */
export const landingDefault = {
  slug: 'wandra-travels',
  published: true,
  accent: '#111113',
  order: ['hero', 'about', 'form'],
  header: {
    enabled: true,
    logo: '/brand/wandra-logo.png',
    name: 'Wandra Travels',
    ctaText: 'Enquire now',
  },
  hero: {
    enabled: true,
    heading: 'Journeys crafted around you',
    sub: 'Handpicked hotels, private cabs and day-by-day plans across Kashmir & beyond — planned end to end by real humans.',
    ctaText: 'Plan my trip',
    image: img('1506905925346-21bda4d32df4'),
  },
  about: {
    enabled: true,
    title: 'Why travel with us',
    body: 'We are a full-service travel studio. Every trip is built from scratch — the hotels we trust, drivers we know by name, and experiences we have done ourselves. One call and your entire holiday is handled: stays, transfers, activities and on-trip support.',
    image: img('1476514525535-07fb3b4ae5f1'),
    points: ['Handpicked hotels & houseboats', 'Private cabs, airport to airport', '24×7 on-trip support'],
  },
  form: {
    enabled: true,
    title: 'Send Package Enquiry',
    sub: 'Tell us about your trip — we usually reply within 30 minutes.',
    buttonText: 'Send Enquiry',
    successMsg: 'Thank you! Your enquiry is with our travel experts — expect a call shortly.',
    fields: { adults: true, children: true, email: true, fromCity: true, destination: true, startDate: true, days: true, comments: true },
  },
}

export const previewThemes = [
  { id: 'standard', name: 'Standard', accent: '#171717', public: true },
  { id: 'classic', name: 'Classic', accent: '#0d74ce', public: true },
  { id: 'modern', name: 'Modern', accent: '#16a34a', public: false },
  { id: 'premium', name: 'Premium', accent: '#8145b5', public: false },
  { id: 'marine', name: 'Marine (Premium)', accent: '#0e7490', public: false },
  { id: 'extensive', name: 'Public Preview · Extensive', accent: '#000000', public: true },
]

export const packages = [
  {
    id: 'pk1', code: 'PKG-202602-0003', clientId: 'cl1', clientName: 'Zubair',
    destination: 'Srinagar - Kashmir Valley, J&K', fromLocation: 'Delhi', days: 4, nights: 3,
    startDate: '2026-02-28', status: 'Quoted', route: 'DEL-SXR-DEL',
    flightIncluded: false,
    pax: { total: 4, adults: 4, children: 0, childrenNoBed: 0, extraBeds: 0, rooms: 2, roomType: 'Double / Twin' },
    cabs: [
      { cabId: 'c1', name: 'Swift Dzire', type: 'Sedan', km: 200, rate: 20, total: 4000 },
    ],
    hotelsAlloc: [
      { night: 1, hotelId: 'h1', name: 'The Lalit Grand Palace', roomType: 'Deluxe', price: 22000, net: 18000 },
      { night: 2, hotelId: 'h2', name: 'Taj Dal View', roomType: 'Superior', price: 22000, net: 20000 },
      { night: 3, hotelId: 'h2', name: 'Taj Dal View', roomType: 'Superior', price: 22000, net: 20000 },
    ],
    itinerary: [
      { day: 1, title: 'Arrival in Srinagar', template: 'Arrival in Srinagar', mealPlan: 'Dinner', stops: [{ destination: 'Dal Lake', activity: 'Shikara ride, Houseboats, Floating market' }], description: 'Arrival in the heart of Kashmir, warm welcome with scenic views.', activities: 'Airport pickup, Check-in at hotel / houseboat, Evening rest, Light walk near Dal Lake', travel: 'Airport → Hotel by private cab', notes: '' },
      { day: 2, title: 'Mountain Escape Journey', template: 'Mountain Escape Journey', mealPlan: 'Breakfast & Dinner', stops: [{ destination: 'Sonamarg', activity: 'Thajiwas Glacier, Snow fields, Meadows' }], description: 'A scenic drive through historic mountains and cultural landmarks.', activities: 'Drass War Memorial, Mountain passes', travel: 'Private transfer from Srinagar to Sonamarg', notes: '' },
      { day: 3, title: 'Gulmarg Gondola Day', template: 'Gulmarg Gondola Day', mealPlan: 'Breakfast & Dinner', stops: [{ destination: 'Gulmarg', activity: 'Gondola Phase 1 & 2, Snow activities' }], description: 'Cable car to the snow line with panoramic alpine views.', activities: 'Gondola ride, Snow play, Photography', travel: 'Srinagar → Gulmarg by private cab', notes: '' },
      { day: 4, title: 'Departure', template: '', mealPlan: 'Breakfast', stops: [{ destination: 'Srinagar', activity: 'Last-minute shopping' }], description: 'Departure with beautiful memories.', activities: 'Check-out, Drop to airport', travel: 'Hotel → Airport by private cab', notes: '' },
    ],
    inclusions: inclusionPresets.inclusions,
    exclusions: inclusionPresets.exclusions,
    categories: [{ name: 'Gondola ride', description: 'Phase 1 & 2 tickets', amount: 10000 }],
    pricing: { mode: 'Total', packageCost: 10000, childCost: 0, discount: 0, gstPercent: 0, hotelTotal: 66000, cabTotal: 4000, otherTotal: 10000 },
    paid: 10000,
    createdAt: '2026-02-26', createdBy: 'Wandra Travels',
  },
]

export const bookings = [
  { id: 'bk1', code: 'BKG-202602-0002', packageId: 'pk1', clientName: 'Zubair', travelDate: '2026-02-28', status: 'Confirmed', value: 90400, paid: 10000 },
]

export const invoices = [
  {
    id: 'in1', code: 'INV-202602-0003', clientId: 'cl1', clientName: 'Zubair', type: 'Booking',
    bookingId: 'bk1', packageId: 'pk1', issueDate: '2026-02-26', dueDate: '2026-11-30', status: 'Partial',
    gst: false,
    items: [
      { description: 'Package Cost - Zubair', qty: 1, rate: 10000, tax: 0 },
      { description: 'Hotel & Accommodation Charges', qty: 1, rate: 66000, tax: 0 },
      { description: 'Transportation Charges', qty: 1, rate: 4000, tax: 0 },
      { description: 'Gondola ride', qty: 1, rate: 10000, tax: 0 },
    ],
    payments: [
      { date: '2026-02-26', method: 'Online', reference: 'TXN-77418', amount: 10000 },
    ],
  },
]

export const quotations = [
  { id: 'q1', packageId: 'pk1', packageCode: 'PKG-202602-0003', client: 'Zubair', travelDate: '2026-02-28', phone: '8009144592', email: 'zubair@gmail.com', status: 'Sent', amount: 90400 },
]

export const galleryStories = [
  { id: 'g1', client: 'Zahid', rating: 5, text: 'Trip was amazing — perfectly organised from start to finish.', date: 'February 2026', status: 'Published', image: '' },
  { id: 'g2', client: 'Zahid', rating: 5, text: 'Keep up the great work. Highly recommend Wandra!', date: 'February 2026', status: 'Pending', image: '' },
]

export const users = [
  { id: 'u1', name: 'Wandra Admin', email: 'admin@wandra.travel', role: 'Admin', phone: '+91 78898 04942', department: 'Management', designation: 'Owner', status: 'Active' },
  { id: 'u2', name: 'Aamir Sales', email: 'aamir@wandra.travel', role: 'Sales', phone: '+91 90000 12345', department: 'Sales', designation: 'Sales Executive', status: 'Active' },
  { id: 'u3', name: 'Rika Sharma', email: 'rika@wandra.travel', role: 'Sales', phone: '+91 98220 44311', department: 'Sales', designation: 'Sales Executive', status: 'Active' },
  { id: 'u4', name: 'Rohit Verma', email: 'rohit@wandra.travel', role: 'Sales', phone: '+91 97110 20455', department: 'Sales', designation: 'Sales Executive', status: 'Active' },
]

/* ------------------------------------------------------------------
   Lead assignment — conditional rules + round robin.
   First enabled rule whose condition matches the incoming lead wins;
   its members take turns (round robin). If nothing matches, the
   fallback decides (whole-team rotation / chosen members / unassigned).
   ------------------------------------------------------------------ */
export const assignmentDefault = {
  enabled: true,
  rules: [
    { id: 'ar1', name: 'Kerala specialists', enabled: true, field: 'destination', values: ['Kerala'], members: ['Rika Sharma', 'Rohit Verma'], next: 0 },
  ],
  fallback: { mode: 'all', members: [], next: 0 },
}

/* ------------------------------------------------------------------
   Feature roles — which role can use which part of the product.
   Admin is a system role and always has everything.
   ------------------------------------------------------------------ */
export const rolesDefault = [
  { id: 'r1', name: 'Admin', system: true, perms: { dashboard: true, clients: true, builder: true, bookings: true, invoices: true, vouchers: true, master: true, reports: true, landing: true, settings: true } },
  { id: 'r2', name: 'Sales', perms: { dashboard: true, clients: true, builder: true, bookings: true, invoices: false, vouchers: true, master: false, reports: true, landing: true, settings: false } },
  { id: 'r3', name: 'Operations', perms: { dashboard: true, clients: true, builder: false, bookings: true, invoices: false, vouchers: true, master: true, reports: false, landing: false, settings: false } },
  { id: 'r4', name: 'Accounts', perms: { dashboard: true, clients: false, builder: false, bookings: true, invoices: true, vouchers: false, master: false, reports: true, landing: false, settings: false } },
]

/* Two plans only: Free to start, Pro for everything. Custom needs are
   handled as a tailored Pro conversation, not a third plan card. */
export const plans = [
  { id: 'free', name: 'Free', price: 0, period: 'forever', limit: 100, featured: false,
    tagline: 'Everything you need to start selling trips.',
    perks: ['Up to 100 clients', 'Quote builder with markup pricing', 'Itineraries, quotations & PDF downloads', 'WhatsApp & email sharing', 'Basic reports', 'Email support'] },
  { id: 'pro', name: 'Pro', price: 2999, priceYear: 1999, oldPrice: 9999, period: 'mo', limit: 0, featured: true,
    tagline: 'The complete engine for a growing agency.', plus: 'Everything in Free, plus:',
    perks: ['Unlimited clients & enquiries', 'Bookings, invoices & payment tracking', 'Vouchers — hotel, transport & activity', 'Lead-capture landing page', 'Auto lead assignment (round robin)', 'In-depth reports with Excel / CSV export', 'Team accounts with roles & permissions', 'Your branding on every document', 'Priority WhatsApp support'] },
]

export const dashboardSeries = {
  revenue: [4, 8, 6, 12, 9, 16, 14, 22, 18, 25],
  bookings: [0, 1, 1, 1, 2, 2, 2, 3, 3, 3],
  packages: [0, 1, 1, 2, 2, 2, 3, 3, 3, 3],
  clients: [0, 1, 1, 1, 2, 2, 2, 2, 2, 2],
}

export const recentActivity = [
  { id: 'a1', text: 'Payment received ₹10,000', sub: 'Zubair · Booking BKG-202602-0002', date: 'Feb 26, 09:18' },
  { id: 'a2', text: 'New booking BKG-202602-0002', sub: 'Zubair · Srinagar 4D/3N', date: 'Feb 25, 16:02' },
  { id: 'a3', text: 'Quotation sent ₹90,400', sub: 'PKG-202602-0003 · Zubair', date: 'Feb 24, 11:40' },
  { id: 'a4', text: 'New lead from Ad Form', sub: 'Mr Zahid · Gulmarg Winter Package', date: 'Feb 18, 14:22' },
  { id: 'a5', text: 'Itinerary shared', sub: 'PKG-202602-0003 · Classic theme', date: 'Feb 24, 10:05' },
  { id: 'a6', text: 'Testimonial published', sub: 'Zahid · 5★ review', date: 'Feb 20, 18:40' },
]

/* 12-month demo analytics for the dashboard (₹ in thousands unless noted) */
export const dashboardAnalytics = {
  months: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
  grossByMonth: [42, 58, 51, 76, 88, 69, 94, 112, 98, 134, 121, 156],
  collectedByMonth: [35, 49, 46, 61, 78, 60, 82, 96, 87, 118, 104, 129],
  bookingsByMonth: [3, 5, 4, 7, 8, 6, 9, 11, 9, 13, 12, 16],
  monthlyTarget: 150, // ₹ thousands for current month
  leadFunnel: [
    { stage: 'Leads captured', value: 48 },
    { stage: 'Qualified', value: 31 },
    { stage: 'Quoted', value: 22 },
    { stage: 'Booked', value: 14 },
    { stage: 'Paid in full', value: 9 },
  ],
  leadSources: [
    { label: 'Ad Forms', value: 19 },
    { label: 'Referral', value: 13 },
    { label: 'WhatsApp', value: 9 },
    { label: 'Walk-in', value: 7 },
  ],
  packageStatusMix: [
    { label: 'Confirmed', value: 6 },
    { label: 'Quoted', value: 4 },
    { label: 'Draft', value: 3 },
    { label: 'Completed', value: 2 },
  ],
  topDestinations: [
    { label: 'Srinagar', value: 14 },
    { label: 'Gulmarg', value: 11 },
    { label: 'Pahalgam', value: 8 },
    { label: 'Sonmarg', value: 6 },
    { label: 'Doodhpathri', value: 3 },
  ],
  weeklyInquiries: [4, 7, 5, 9, 6, 11, 8],
  weekDays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  avgBookingValue: 64, // ₹ thousands
  avgMarginPct: 22,
  repeatClientPct: 31,
  quoteToBookPct: 44,
  upcomingDepartures: [
    { code: 'BKG-202602-0002', client: 'Zubair', route: 'Srinagar 4D/3N', date: 'Feb 28', pax: 4, status: 'Confirmed' },
    { code: 'PKG-202602-0004', client: 'Mr Zahid', route: 'Gulmarg 3D/2N', date: 'Mar 06', pax: 2, status: 'Quoted' },
    { code: 'PKG-202603-0001', client: 'Sana Group', route: 'Pahalgam 5D/4N', date: 'Mar 14', pax: 9, status: 'Pending' },
  ],
  profitByMonth: [9, 13, 11, 17, 20, 15, 21, 26, 22, 31, 28, 37],
  marginPctByMonth: [18, 20, 19, 21, 23, 20, 22, 24, 22, 25, 23, 26],
  invoiceAging: [
    { label: '0–15 days', value: 38 },
    { label: '16–30 days', value: 22 },
    { label: '31–60 days', value: 14 },
    { label: '60+ days', value: 6 },
  ],
  teamLeaderboard: [
    { name: 'Aamir', role: 'Sales Executive', revenue: 412, deals: 7 },
    { name: 'Khushnood', role: 'Owner', revenue: 365, deals: 5 },
    { name: 'Sana', role: 'Operations', revenue: 238, deals: 4 },
    { name: 'Bilal', role: 'Sales', revenue: 129, deals: 2 },
  ],
  ratingAvg: 4.8,
  ratingCount: 31,
  ratingDist: [
    { stars: 5, value: 22 },
    { stars: 4, value: 6 },
    { stars: 3, value: 2 },
    { stars: 2, value: 1 },
    { stars: 1, value: 0 },
  ],
  clientCities: [
    { label: 'Delhi', value: 16 },
    { label: 'Mumbai', value: 12 },
    { label: 'Bengaluru', value: 9 },
    { label: 'Hyderabad', value: 6 },
    { label: 'Srinagar', value: 5 },
  ],
  fleetUtilization: [
    { label: 'Innova Crysta', value: 86 },
    { label: 'Swift Dzire', value: 74 },
    { label: 'Tempo 12-Seater', value: 61 },
    { label: 'Toyota Etios', value: 48 },
  ],
  heatWeeks: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
  heatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  inquiryHeatmap: [
    [2, 4, 3, 5, 6, 4, 7, 9],
    [1, 3, 4, 4, 5, 6, 8, 10],
    [3, 2, 5, 6, 4, 7, 6, 8],
    [2, 5, 4, 7, 8, 6, 9, 11],
    [4, 6, 5, 8, 7, 9, 10, 12],
    [6, 7, 8, 9, 11, 10, 12, 14],
    [3, 4, 5, 6, 7, 8, 9, 10],
  ],
}
