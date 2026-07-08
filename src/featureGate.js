/* ============================================================
   Maps CRM routes to the admin feature-catalog keys, so the
   admin panel's per-agency / per-plan feature toggles actually
   gate the agency UI (nav visibility + route access).
   Billing / upgrade / support / dashboard are always available.
   ============================================================ */

// ordered longest-prefix-first so nested routes match correctly
export const ROUTE_FEATURES = [
  ['/app/clients', 'crm.view'],
  ['/app/packages/inclusions', 'master.inclusions'],
  ['/app/packages/templates', 'builder.templates'],
  ['/app/packages', 'builder.access'],
  ['/app/destinations', 'master.destinations'],
  ['/app/hotels', 'master.hotels'],
  ['/app/cabs', 'master.cabs'],
  ['/app/services', 'master.service_locations'],
  ['/app/activities', 'master.activities'],
  ['/app/bookings', 'bookings.view'],
  ['/app/invoices', 'invoices.view'],
  ['/app/quotations', 'quotations.view'],
  ['/app/vouchers', 'vouchers.view'],
  ['/app/landing', 'landing.builder'],
  ['/app/reports', 'reports.view'],
  ['/app/gallery', 'reviews.view'],
  ['/app/users', 'team.users'],
  ['/app/roles', 'team.roles'],
  ['/app/assignment', 'team.lead_assignment'],
  ['/app/settings', 'branding.agency_profile'],
]

/** The feature key that gates a given pathname, or null if always-available. */
export function pathFeature(pathname) {
  const m = ROUTE_FEATURES.find(([p]) => pathname === p || pathname.startsWith(p + '/'))
  return m ? m[1] : null
}
