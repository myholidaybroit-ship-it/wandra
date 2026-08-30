/* ============================================================
   The CRM-side gatekeeper map.

   Every route carries TWO independent gates, mirroring the API:
     · feature — the admin panel's per-agency / per-plan feature key.
                 Missing it means the AGENCY isn't entitled  → 402.
     · perm    — the ROLE_MODULES key on the user's role.
                 Missing it means this TEAMMATE isn't allowed → 403.

   Nav visibility and route access both read this table, so the UI can
   never offer something the backend would refuse. Support and the
   dashboard shell stay reachable for everyone; billing & upgrade need
   the `settings` role permission.
   ============================================================ */

// ordered longest-prefix-first so nested routes match correctly
export const ROUTE_ACCESS = [
  ['/app/clients', 'crm.view', 'clients'],
  ['/app/packages/inclusions', 'master.inclusions', 'master'],
  ['/app/packages/templates', 'builder.templates', 'builder'],
  ['/app/packages', 'builder.access', 'builder'],
  ['/app/destinations', 'master.destinations', 'master'],
  ['/app/hotels', 'master.hotels', 'master'],
  ['/app/cabs', 'master.cabs', 'master'],
  ['/app/services', 'master.service_locations', 'master'],
  ['/app/activities', 'master.activities', 'master'],
  ['/app/bookings', 'bookings.view', 'bookings'],
  ['/app/invoices', 'invoices.view', 'invoices'],
  // payments & ledger ride on the invoices module (same money-trail access)
  ['/app/payments', 'invoices.view', 'invoices'],
  ['/app/calendar', 'bookings.view', 'bookings'],
  ['/app/quotations', 'quotations.view', 'builder'],
  ['/app/vouchers', 'vouchers.view', 'vouchers'],
  ['/app/followups/rules', 'tasks.automation', 'tasks'],
  ['/app/followups', 'tasks.view', 'tasks'],
  ['/app/landing', 'landing.builder', 'landing'],
  ['/app/reports', 'reports.view', 'reports'],
  ['/app/gallery', 'reviews.view', null],
  ['/app/users', 'team.users', 'settings'],
  ['/app/roles', 'team.roles', 'settings'],
  ['/app/assignment', 'team.lead_assignment', 'settings'],
  ['/app/policies', 'branding.agency_profile', 'settings'],
  ['/app/settings', 'branding.agency_profile', 'settings'],
  // plan & billing are the agency owner's business — not every teammate's
  ['/app/billing', null, 'settings'],
  ['/app/upgrade', null, 'settings'],
]

/** The [feature, perm] pair guarding a pathname — nulls mean "always allowed". */
export function pathAccess(pathname) {
  const m = ROUTE_ACCESS.find(([p]) => pathname === p || pathname.startsWith(p + '/'))
  return m ? { feature: m[1], perm: m[2] } : { feature: null, perm: null }
}
