/**
 * Copy for redesign round v8 (migration 20261127_225300_redesign_v8_content).
 * Every string here is quoted verbatim from one of these sources:
 *
 *  - CHANGE_TABLE: redesign-2026-11-27/v6/CHANGE-TABLE.md (the v6 first-screen
 *    dedupe: the €49 / 10% line once in the hero and once in its detail card).
 *  - LAWYER_OK: the v8 brief from Marketeer (Yaron 27 Nov 23:45, "Yes, send v8
 *    and the text fixes to Builder as drafts, no publish"): the two home door 2
 *    bullets and the home frame badge, marked "Lawyer OK" there.
 *  - MOCKUP_V8: words drawn inside the v8 mockup frames
 *    (redesign-2026-11-27/v8/*.html), NL only.
 *
 * A locale value of `null` is a gap: the source has no text for that locale
 * and none is invented here. The renderer draws that element without text and
 * the PR lists it for Marketeer. tests/unit/redesignV8.unit.spec.ts checks the
 * sources and the gaps.
 */
import type { Locale } from './pages'

export type V8String = { nl: string; en: string; source: 'CHANGE_TABLE' | 'LAWYER_OK' }
export type V8Label = { nl: string; en: string | null; source: 'MOCKUP_V8' }

const s = (nl: string, en: string, source: V8String['source']): V8String => ({ nl, en, source })

export const V8 = {
  home: {
    /** CHANGE-TABLE: home productHero.sub, and the closing CTA text ("Reuse the new home sub"). */
    sub: s('Een website die wij bouwen en onderhouden. Alleen voor zakelijke opdrachtgevers.', 'A website we build and maintain. Business clients only.', 'CHANGE_TABLE'),
    /** CHANGE-TABLE: home productHero.showcase.badge (NEW, Lawyer); Lawyer OK in the v8 brief. */
    badge: s('Bouw · Hosting · Onderhoud', 'Build · Hosting · Maintenance', 'LAWYER_OK'),
    /** v8 brief (Lawyer OK): door 2 has these two bullets. The first is also CHANGE-TABLE door 2 bullets[1]. */
    door2Bullets: [
      s('Teksten en foto’s beheert u zelf in het CMS.', 'You manage words and photos yourself in the CMS.', 'LAWYER_OK'),
      s('Beveiligings- en CMS-updates horen bij de hosting.', 'Security and CMS updates are part of the hosting.', 'LAWYER_OK'),
    ],
    /** CHANGE-TABLE (same pass below the fold): home trustBar items[0]. */
    trust0: s('Eén omgeving per site, aan de edge', 'One environment per site, at the edge', 'CHANGE_TABLE'),
    /** v8 mockup: the sticky button in the CMS phone. No EN text in any source. */
    saveLabel: { nl: 'Opslaan', en: null, source: 'MOCKUP_V8' } satisfies V8Label,
  },
  prijzen: {
    /** v8 mockup: the two window labels in the prijzen frame. No EN text in any source. */
    liveLabel: { nl: 'Live', en: null, source: 'MOCKUP_V8' } satisfies V8Label,
    stagingLabel: { nl: 'Staging', en: null, source: 'MOCKUP_V8' } satisfies V8Label,
  },
  partner: {
    /** CHANGE-TABLE: partner productHero.showcase.badge. */
    badge: s('Jij kiest wie de klant factureert.', 'You choose who invoices the client.', 'CHANGE_TABLE'),
  },
} as const

export const label = (value: V8Label, l: Locale): string | null => value[l]
