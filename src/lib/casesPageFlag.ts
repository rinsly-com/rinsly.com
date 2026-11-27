import { readServerEnv } from './env'

/** Shared NL/EN slug for the cases page. Kept in seed so it can be re-enabled. */
export const CASES_PAGE_SLUG = 'cases'

/** Non-secret wrangler / process env flag. Default off. */
export const CASES_PAGE_FLAG = 'RINSLY_CASES_PAGE_ENABLED'

/**
 * The public /cases page is on only for `1`, `true`, or `yes` (any case,
 * surrounding space ignored). Anything else, including unset, is off.
 *
 * Off until written client consent exists (Lawyer §13 P2-01). Server-only:
 * this reads `readServerEnv()`. Do not flip the flag without that consent.
 */
export function isCasesPageEnabled(raw?: string): boolean {
  const source = raw !== undefined ? raw : (readServerEnv().RINSLY_CASES_PAGE_ENABLED ?? '')
  const value = source.trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes'
}

/** /cases (any locale) is hidden — 404 — until the flag is on. Other slugs are unaffected. */
export function isCasesPageHidden(slug: string | undefined, raw?: string): boolean {
  return slug === CASES_PAGE_SLUG && !isCasesPageEnabled(raw)
}
