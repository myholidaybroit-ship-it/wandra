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
  plan: { name: 'Free Trial', limit: 20 },
}

export const destinations = [
  { id: 'd1', name: 'Srinagar', location: 'Kashmir Valley, J&K', features: 'Dal Lake, Houseboats, Mughal Gardens, Shankaracharya', image: '' },
  { id: 'd2', name: 'Gulmarg', location: 'Baramulla, J&K', features: 'Gondola, Skiing, Meadows, Golf course', image: '' },
  { id: 'd3', name: 'Pahalgam', location: 'Anantnag, J&K', features: 'Lidder River, Betaab Valley, Aru Valley, Horse riding', image: '' },
  { id: 'd4', name: 'Sonamarg', location: 'Ganderbal, J&K', features: 'Thajiwas Glacier, Snow fields, Meadows', image: '' },
  { id: 'd5', name: 'Dal Lake', location: 'Srinagar, J&K', features: 'Shikara ride, Houseboats, Floating market', image: '' },
  { id: 'd6', name: 'Kargil', location: 'Ladakh (via Srinagar route)', features: 'Drass War Memorial, Mountain passes', image: '' },
]

export const hotels = [
  { id: 'h1', name: 'The Lalit Grand Palace', city: 'Srinagar', phone: '+91 194 250 1001', email: 'res@lalitsrinagar.com', rating: 5, buyingPrice: 18000, roomTypes: 'Deluxe, Palace Room, Suite', description: 'Heritage palace hotel overlooking Dal Lake.' },
  { id: 'h2', name: 'Taj Dal View', city: 'Srinagar', phone: '+91 194 246 1234', email: 'res@tajdalview.com', rating: 5, buyingPrice: 20000, roomTypes: 'Superior, Deluxe, Suite', description: 'Luxury hotel with panoramic lake views.' },
  { id: 'h3', name: 'Vivanta Dal View', city: 'Srinagar', phone: '+91 194 246 5555', email: 'res@vivanta.com', rating: 5, buyingPrice: 16000, roomTypes: 'Deluxe, Premium', description: 'Hill-top luxury overlooking the valley.' },
  { id: 'h4', name: 'Radisson Collection Hotel & Spa', city: 'Srinagar', phone: '+91 194 240 0000', email: 'res@radisson.com', rating: 5, buyingPrice: 15000, roomTypes: 'Superior, Suite', description: 'Modern spa hotel near city centre.' },
  { id: 'h5', name: 'Hotel Comrade Inn', city: 'Gulmarg', phone: '+91 195 425 4321', email: 'stay@comradeinn.com', rating: 4, buyingPrice: 9000, roomTypes: 'Standard, Deluxe', description: 'Cozy stay close to the Gondola.' },
  { id: 'h6', name: 'The Khyber Himalayan Resort & Spa', city: 'Gulmarg', phone: '+91 195 425 6666', email: 'res@khyber.com', rating: 5, buyingPrice: 24000, roomTypes: 'Deluxe, Suite, Cottage', description: 'Premier alpine luxury resort.' },
  { id: 'h7', name: 'Houseboat Young Bombay', city: 'Srinagar', phone: '+91 990 600 1122', email: 'youngbombay@dal.com', rating: 4, buyingPrice: 8000, roomTypes: 'Deluxe Houseboat', description: 'Classic Dal Lake houseboat experience.' },
]

export const cabs = [
  { id: 'c1', name: 'Swift Dzire', type: 'Sedan', acType: 'AC', capacity: 4, ratePerKm: 20, contact: '+91 98765 11111', status: 'Active' },
  { id: 'c2', name: 'Toyota Etios', type: 'Sedan', acType: 'AC', capacity: 3, ratePerKm: 20, contact: '+91 98765 22222', status: 'Active' },
  { id: 'c3', name: 'Toyota Innova', type: 'SUV', acType: 'AC', capacity: 6, ratePerKm: 25, contact: '+91 98765 33333', status: 'Active' },
  { id: 'c4', name: 'Innova Crysta', type: 'SUV', acType: 'AC', capacity: 6, ratePerKm: 28, contact: '+91 98765 44444', status: 'Active' },
  { id: 'c5', name: 'Tempo Traveller 12 Seater', type: 'Tempo Traveller', acType: 'AC', capacity: 12, ratePerKm: 40, contact: '+91 98765 55555', status: 'Active' },
  { id: 'c6', name: 'Tempo Traveller 17 Seater', type: 'Tempo Traveller', acType: 'AC', capacity: 17, ratePerKm: 48, contact: '+91 98765 66666', status: 'Active' },
]

export const clients = [
  { id: 'cl1', code: 'CLI-202602-001', name: 'Zubair', email: 'zubair@gmail.com', phone: '8009144592', address: 'Ghalib Abad Shaltang Srinagar', city: 'Srinagar', state: 'J&K', country: 'India', status: 'Active', leadTemp: 'Warm', note: 'New Inquiry', interest: 'Kashmir Trip', budget: 90000, source: 'Referral', createdAt: '2026-02-12' },
  { id: 'cl2', code: 'CLI-202602-002', name: 'Mr Zahid', email: 'zahidnazir330@gmail.com', phone: '8899144592', address: 'Lal Chowk, Srinagar', city: 'Srinagar', state: 'J&K', country: 'India', status: 'Active', leadTemp: 'Hot', note: 'Ready to book', interest: 'Gulmarg Winter Package', budget: 45000, source: 'Ad Form', createdAt: '2026-02-18' },
]

export const itineraryTemplates = [
  { id: 't1', name: 'Arrival in Srinagar', mealPlan: 'Dinner', activity: 'Shikara ride, Houseboats, Floating market', description: 'Arrival in the heart of Kashmir, warm welcome with scenic views.' },
  { id: 't2', name: 'Mountain Escape Journey', mealPlan: 'Breakfast & Dinner', activity: 'Thajiwas Glacier, Snow fields, Meadows', description: 'A scenic drive through historic mountains and cultural landmarks.' },
  { id: 't3', name: 'Gulmarg Gondola Day', mealPlan: 'Breakfast & Dinner', activity: 'Gondola Phase 1 & 2, Snow activities', description: 'Cable car to the snow line with panoramic alpine views.' },
]

export const inclusionPresets = {
  inclusions: ['Accommodation as per itinerary', 'Daily breakfast & dinner', 'All transfers by private cab', 'Welcome drink on arrival', 'Driver allowance, tolls & parking'],
  exclusions: ['Airfare / train fare', 'Lunch & personal expenses', 'Gondola / activity tickets unless specified', 'Travel insurance', 'Anything not mentioned in inclusions'],
}

export const categoryGroups = [
  'Meals', 'Hotel Policies', 'Services & Support', 'Visa & Drinks',
  'Transportation', 'Insurance & Medical', 'Personal Expenses', 'Policy / Cancellation', 'Travel Costs',
]

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
]

export const plans = [
  { id: 'free', name: 'Free Trial', price: 0, period: 'forever', limit: 20, featured: false, perks: ['20 clients / month (resets monthly)', 'Itineraries & quotations', '6 itinerary themes', 'Shareable links & PDF', 'Email support'] },
  { id: 'growth', name: 'Growth', price: 1499, oldPrice: 4999, period: 'mo', limit: 100, featured: true, perks: ['100 clients / month', 'GST & non-GST invoices', 'Vouchers & payment tracking', 'Reports & profit analytics', 'WhatsApp support', 'Team accounts'] },
  { id: 'scale', name: 'Scale', price: 3999, oldPrice: 12999, period: 'mo', limit: 500, featured: false, perks: ['500 clients / month', 'Everything in Growth', 'Lead capture forms', 'Custom branding', 'Priority support'] },
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
]
