// Affiliate partner registry — centralised so we can swap referral codes,
// track partners, and reason about revenue surface without hunting through
// the task corpus. Each task link with `type: 'affiliate'` is matched by
// hostname/path against this registry to derive the partner.

export interface AffiliatePartner {
  id:           string
  name:         string
  // Hostnames the destination must match (suffix match on URL.hostname).
  // We compare against the parsed hostname, never the full URL — otherwise
  // an attacker could craft `https://evil.com/?x=wise.com` and pass.
  hosts:        string[]
  category:     'banking' | 'mobile' | 'housing' | 'insurance' | 'utility' | 'transfer' | 'other'
  // Commercial — used only for internal reporting / VC narrative, not shown to users
  commission?:  string        // e.g. "€50 per funded account" or "10% recurring"
  status:       'live' | 'pending' | 'placeholder'
}

export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  // Banking / transfers
  { id: 'wise',          name: 'Wise',         hosts: ['wise.com'],            category: 'transfer', commission: '€60 per funded customer', status: 'live' },
  { id: 'revolut',       name: 'Revolut',      hosts: ['revolut.com'],         category: 'banking',  commission: '€30 per activated account', status: 'pending' },
  { id: 'n26',           name: 'N26',          hosts: ['n26.com'],             category: 'banking',  commission: '€40 per funded account', status: 'pending' },
  { id: 'bnp-hello',     name: 'Hello bank!',  hosts: ['hellobank.be'],        category: 'banking',  commission: 'TBD — direct partnership', status: 'placeholder' },
  // Mobile
  { id: 'mobile-vikings', name: 'Mobile Vikings', hosts: ['mobilevikings.be'], category: 'mobile', commission: '€15 per SIM activation', status: 'pending' },
  // Housing (short-term)
  { id: 'spotahome',     name: 'Spotahome',    hosts: ['spotahome.com'],       category: 'housing',  commission: '40% of platform fee', status: 'pending' },
  { id: 'homelike',      name: 'Homelike',     hosts: ['thehomelike.com'],     category: 'housing',  commission: 'CPA', status: 'pending' },
  // Tax / NIF
  { id: 'bordr',         name: 'Bordr',        hosts: ['bordr.io'],            category: 'other',    commission: '$20 per NIF order', status: 'live' },
]

/**
 * Resolve an outbound URL to its affiliate partner, if any.
 *
 * Compares the URL's parsed hostname (suffix-match) against each partner's
 * declared hosts. Defends against open-redirect: an attacker crafting
 * `https://evil.com/?x=wise.com` will not match because we only look at
 * the parsed hostname, never the full URL string.
 */
export function resolvePartner(url: string): AffiliatePartner | null {
  let host: string
  try { host = new URL(url).hostname.toLowerCase() }
  catch { return null }
  for (const p of AFFILIATE_PARTNERS) {
    for (const allowed of p.hosts) {
      const a = allowed.toLowerCase()
      if (host === a || host.endsWith('.' + a)) return p
    }
  }
  return null
}

/**
 * Wrap an outbound URL in our click-tracking endpoint. Roundtrips through
 * /api/affiliate-click so we can attribute revenue and rate-limit fraud.
 * Pass-through (no wrap) for URLs we don't recognise as affiliates.
 */
export function trackedUrl(url: string, taskSlug?: string): string {
  const partner = resolvePartner(url)
  if (!partner) return url
  const params = new URLSearchParams({ to: url, p: partner.id })
  if (taskSlug) params.set('t', taskSlug)
  return `/api/affiliate-click?${params.toString()}`
}

export function partnerSummary() {
  const live = AFFILIATE_PARTNERS.filter(p => p.status === 'live').length
  const pending = AFFILIATE_PARTNERS.filter(p => p.status === 'pending').length
  return { live, pending, total: AFFILIATE_PARTNERS.length }
}
