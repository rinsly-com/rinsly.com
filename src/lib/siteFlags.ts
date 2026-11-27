import { readServerEnv } from './env'

/**
 * Release flags for the rinsly.com refactor (Marketeer brief 27 Nov 2026,
 * refactor plan 003). Every flag is OFF unless its env variable is `1`,
 * `true` or `yes` (any case, surrounding space ignored). Nothing in this repo
 * sets them: not wrangler.jsonc, not a workflow, not the seed. They are build
 * and server env only (prod is a static build, so a flag is read when the
 * static site is built).
 *
 * Who may turn one on:
 * - x3v3AndF1: X3 v3 FINAL no-build-fee copy, F1 footnote, cost FAQ A1 and the
 *   Care-only route lines. Gate: AV art. 9/10 live, Lawyer's check passed, and
 *   Yaron reconfirms Care-only.
 * - nichePages: the four niche landers and their nav/sitemap links. Same gate.
 * - woerdenPage: links to /nl/website-laten-maken-woerden. Gate: Yaron says
 *   publish.
 * - footerOwnerName: the owner's personal name in the footer identity line.
 *   Gate: the KvK extract is in (Marketeer/Lawyer).
 * - portraitBio: the /over portrait and bio. Gate: Yaron sends the photo and
 *   facts, Lawyer reads it.
 *
 * Part 1 of the refactor only adds the switches. The sections they gate
 * arrive with the structural part, which waits on Yaron's route choice.
 */
export const SITE_FLAGS = {
  x3v3AndF1: 'RINSLY_FLAG_X3V3_AND_F1',
  nichePages: 'RINSLY_FLAG_NICHE_PAGES',
  woerdenPage: 'RINSLY_FLAG_WOERDEN_PAGE',
  footerOwnerName: 'RINSLY_FLAG_FOOTER_OWNER_NAME',
  portraitBio: 'RINSLY_FLAG_PORTRAIT_BIO',
} as const

export type SiteFlag = keyof typeof SITE_FLAGS

/** `1`, `true` or `yes` is on; anything else, including unset, is off. */
export function parseFlag(raw: string | undefined): boolean {
  const value = (raw ?? '').trim().toLowerCase()
  return value === '1' || value === 'true' || value === 'yes'
}

/** Server-only: reads `readServerEnv()`. Pass `raw` to test a value. */
export function isSiteFlagOn(flag: SiteFlag, raw?: string): boolean {
  if (raw !== undefined) return parseFlag(raw)
  return parseFlag(readServerEnv()[SITE_FLAGS[flag]])
}

/** Every flag with its current state, for logs and the PR proof. */
export function siteFlagStates(): Record<SiteFlag, boolean> {
  return Object.fromEntries(
    (Object.keys(SITE_FLAGS) as SiteFlag[]).map((flag) => [flag, isSiteFlagOn(flag)]),
  ) as Record<SiteFlag, boolean>
}
