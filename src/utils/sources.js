import { useApp } from '../store/AppContext'

/* Lead sources are agency-customisable (Settings → Lead Sources) and stored on
   agency.leadSources. This is the fallback used only if none are configured. */
export const DEFAULT_LEAD_SOURCES = ['Website', 'Landing Page', 'Ad Form', 'Referral', 'WhatsApp', 'Walk-in', 'B2B Agent', 'Instagram']

/** The agency's configured lead sources (falls back to defaults). */
export function useLeadSources() {
  const { agency } = useApp()
  const list = agency?.leadSources
  return Array.isArray(list) && list.length ? list : DEFAULT_LEAD_SOURCES
}
