import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { LOCAL_PAGE_SLUG, buildLocalPageJsonLd } from '../../src/lib/localPageJsonLd'
import { PLACEHOLDER_NOINDEX_SLUGS, SITEMAP_EXCLUDED_SLUGS, slugsForSitemap } from '../../src/lib/sitemapSlugs'

/**
 * Yaron (26 Nov 15:59, own card answer in Marketeer's chat): the Woerden/Utrecht
 * local page is REMOTE ONLY from Woerden. No in-person service in Utrecht.
 * Final copy (Marketeer, Lawyer-checked) is pinned slot by slot below, together
 * with the structure and the claim limits.
 */
const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')

function localLayoutSource(): string {
  const start = seed.indexOf('const localWoerdenLayout')
  const end = seed.indexOf('\n/* ---', start)
  if (start < 0 || end < start) throw new Error('localWoerdenLayout slice not found')
  return seed.slice(start, end)
}

const BANNED = [
  /\baltijd\b/i,
  /\bnooit\b/i,
  /\bgegarandeerd\b/i,
  /\balways\b/i,
  /\bnever\b/i,
  /\bguarantee/i,
  /gratis bouw/i,
  /free build/i,
  /\buptime\b/i,
  /\bback-?ups?\b/i,
  /\b\d+\s*(klanten|clients|studios)\b/i,
  /binnen \d+ (uur|minuten|dagen)/i,
  /within \d+ (hours?|minutes?|days?)/i,
  /\b(framer|webflow|wix|squarespace)\b/i,
]

describe('local page Woerden/Utrecht: structure', () => {
  const layout = localLayoutSource()

  it('is registered under the shared slug, stays noindex, and is omitted from the sitemap until Yaron decides', () => {
    expect(LOCAL_PAGE_SLUG).toBe('website-laten-maken-woerden')
    expect(seed).toMatch(/LOCAL_PAGE_SLUG/)
    expect(seed).toMatch(/slug:\s*SLUG\.woerden/)
    // noindex stays until Yaron decides; do not drop this slug from PLACEHOLDER_NOINDEX_SLUGS just because final copy has landed.
    expect(PLACEHOLDER_NOINDEX_SLUGS.has(LOCAL_PAGE_SLUG)).toBe(true)
    expect(SITEMAP_EXCLUDED_SLUGS.has(LOCAL_PAGE_SLUG)).toBe(true)
    expect(slugsForSitemap(['over', LOCAL_PAGE_SLUG])).not.toContain(LOCAL_PAGE_SLUG)
    expect(slugsForSitemap(['over', LOCAL_PAGE_SLUG])).toContain('over')
    expect(seed).toMatch(/PLACEHOLDER_NOINDEX_SLUGS/)
    expect(seed).toMatch(/placeholderNoindexMeta/)
    expect(seed).toMatch(/noindex:\s*true/)
    // The helper writes false for indexable slugs, but only when the seed creates the page row.
    expect(seed).toMatch(/noindex:\s*false/)
    expect(seed).toMatch(/SITEMAP_EXCLUDED_SLUGS\.has\(slug\)/)
    const metaStart = seed.indexOf('const localWoerdenMeta')
    const metaEnd = seed.indexOf('const localWoerdenLayout')
    expect(metaStart).toBeGreaterThan(-1)
    expect(seed.slice(metaStart, metaEnd)).not.toMatch(/noindex/)
  })

  it('a slug not in the placeholder list gets noindex false and keeps its title/description', () => {
    // Same helper as scripts/seed.ts (pass 2 merges page.meta with this).
    const placeholderNoindexMeta = (
      slug: string,
    ): { meta: { noindex: boolean } } | Record<string, never> => {
      if (PLACEHOLDER_NOINDEX_SLUGS.has(slug)) return { meta: { noindex: true } }
      if (SITEMAP_EXCLUDED_SLUGS.has(slug)) return {}
      return { meta: { noindex: false } }
    }
    const merge = (slug: string, pageMeta: { title: string; description: string }) => ({
      ...pageMeta,
      ...placeholderNoindexMeta(slug).meta,
    })

    const about = { title: 'Over ons', description: 'About the studio' }
    expect(merge('over', about)).toEqual({
      title: 'Over ons',
      description: 'About the studio',
      noindex: false,
    })

    const woerden = { title: '[Concept] Woerden', description: '[Draft] From Woerden' }
    expect(merge(LOCAL_PAGE_SLUG, woerden)).toEqual({
      title: '[Concept] Woerden',
      description: '[Draft] From Woerden',
      noindex: true,
    })

    expect(placeholderNoindexMeta('privacy')).toEqual({})
    expect(placeholderNoindexMeta('voorwaarden')).toEqual({})
  })

  it('has hero, how-we-work cards, region prose, FAQ and a contact CTA', () => {
    for (const marker of ['pageHero(', "blockType: 'services'", "blockType: 'richText'", "blockType: 'accordion'"]) {
      expect(layout).toContain(marker)
    }
    expect(layout).toMatch(/\bcta\(\s*locale/)
  })

  it('says remote only, in NL and EN, and says no visits in Utrecht', () => {
    expect(layout).toMatch(/op afstand/)
    expect(layout).toMatch(/remotely|remote/)
    expect(layout).toMatch(/Nee\. Wij werken op afstand/)
    expect(layout).toMatch(/No\. We work remotely/)
    expect(layout).not.toMatch(/bij je op kantoor|at your office|aan huis|spreekuur|walk-?in/i)
  })

  it('carries no banned claims in the copy', () => {
    for (const re of BANNED) expect(layout, String(re)).not.toMatch(re)
  })

  it('carries no placeholder markers any more', () => {
    const meta = seed.slice(seed.indexOf('const localWoerdenMeta'), seed.indexOf('const localWoerdenLayout'))
    expect(layout).not.toMatch(/\[Concept\]|\[Draft\]/)
    expect(meta).not.toMatch(/\[Concept\]|\[Draft\]/)
  })

  it('has Marketeer\'s final copy, word for word (LW-01..LW-30, Lawyer-checked §12)', () => {
    // [slot, NL, EN] from ~/Rinsly/marketing/copy-local-woerden-final.md. LW-30 (page title) is unchanged.
    const slots: ReadonlyArray<readonly [string, string, string]> = [
      ['LW-01', 'Website laten bouwen, op afstand vanuit Woerden · Rinsly', 'Website building, remotely from Woerden · Rinsly'],
      ['LW-02', 'Rinsly bouwt en host websites voor ontwerpstudio’s in de provincie Utrecht, op afstand vanuit Woerden. Alleen voor zakelijke opdrachtgevers.', 'Rinsly builds and hosts websites for design studios in the province of Utrecht, remotely from Woerden. For business clients only.'],
      ['LW-03', 'Vanuit Woerden', 'From Woerden'],
      ['LW-04', 'Websites bouwen en hosten, op afstand vanuit Woerden', 'Building and hosting websites, remotely from Woerden'],
      ['LW-05', 'Rinsly zit in Woerden. Voor ontwerpstudio’s in de provincie Utrecht werken we op afstand: kennismaken per telefoon of video, bouwen en beheren zonder dat iemand hoeft te reizen.', 'Rinsly is based in Woerden. For design studios in the province of Utrecht we work remotely: an intro by phone or video, building and managing without anyone having to travel.'],
      ['LW-06', 'Neem contact op', 'Get in touch'],
      ['LW-07', 'Op afstand', 'Remote'],
      ['LW-08', 'Zo werken we samen', 'How we work together'],
      ['LW-09', 'We werken op afstand. Dat houdt het eenvoudig, ook als je studio in de stad Utrecht of elders in de provincie zit.', 'We work remotely. That keeps it simple, whether your studio is in the city of Utrecht or elsewhere in the province.'],
      ['LW-10', 'Kennismaken op afstand', 'An intro, remotely'],
      ['LW-11', 'We plannen een gesprek per telefoon of video om te horen wat je studio nodig heeft.', 'We schedule a call by phone or video to hear what your studio needs.'],
      ['LW-12', 'Bouwen op afstand', 'Building, remotely'],
      ['LW-13', 'Je levert het ontwerp aan, wij bouwen het als website en delen de voortgang online.', 'You deliver the design, we build it as a website and share progress online.'],
      ['LW-14', 'Hosting en beheer op afstand', 'Hosting and management, remotely'],
      ['LW-15', 'Na livegang hosten en onderhouden we de website en passen we aan waar nodig, via e-mail of een kort gesprek.', 'After launch we host and maintain the website and adjust where needed, by email or a short call.'],
      ['LW-16', 'Regio', 'Region'],
      ['LW-17', 'Voor ontwerpstudio’s in de provincie Utrecht', 'For design studios in the province of Utrecht'],
      ['LW-18', 'Rinsly is gevestigd in Woerden. We werken voor ontwerpstudio’s in de provincie Utrecht, op afstand: per telefoon, video en e-mail. Er is geen dienstverlening op locatie.', 'Rinsly is based in Woerden. We work for design studios in the province of Utrecht, remotely: by phone, video and email. There is no on-site service.'],
      ['LW-19', 'Wil je liever eerst praten? Plan een telefoongesprek of een videogesprek via het contactformulier.', 'Prefer to talk first? Schedule a phone call or a video call through the contact form.'],
      ['LW-20', 'Veelgestelde vragen', 'FAQ'],
      ['LW-21', 'Praktisch', 'Practicalities'],
      ['LW-22', 'Komen jullie langs in Utrecht?', 'Do you visit us in Utrecht?'],
      ['LW-23', 'Nee. Wij werken op afstand vanuit Woerden: per telefoon, video en e-mail. Er is geen dienstverlening op locatie.', 'No. We work remotely from Woerden: by phone, video and email. There is no on-site service.'],
      ['LW-24', 'Voor wie werkt Rinsly?', 'Who does Rinsly work for?'],
      // Lawyer §12 FIX text ("zakelijke opdrachtgever" / "A business or professional").
      ['LW-25', 'Voor ontwerpstudio’s die hun ontwerp als website willen laten bouwen en hosten. Ook een zakelijke opdrachtgever die zelf een website wil, zonder studio, kan contact opnemen. Alleen voor zakelijke opdrachtgevers.', 'For design studios that want their design built and hosted as a website. A business or professional that wants a website without a studio can also get in touch. For business clients only.'],
      ['LW-26', 'Contact', 'Contact'],
      ['LW-27', 'Laten we praten', 'Let’s talk'],
      ['LW-28', 'Stuur een bericht, dan plannen we een gesprek op afstand.', 'Send a message and we schedule a remote call.'],
      ['LW-29', 'Neem contact op', 'Get in touch'],
      ['LW-30', 'Website laten maken in Woerden', 'Website building from Woerden'],
    ]
    expect(slots).toHaveLength(30)
    const scope = seed.slice(seed.indexOf('const localWoerdenMeta'), seed.indexOf('/* ------------------------------ header / footer'))
    const withTitle = seed // LW-30 lives in the page registry (title), outside the layout slice
    for (const [id, nl, en] of slots) {
      const haystack = id === 'LW-30' ? withTitle : scope
      expect(haystack, `${id} NL`).toContain(`'${nl}'`)
      expect(haystack, `${id} EN`).toContain(`'${en}'`)
    }
  })

  it('has SEO meta for both locales', () => {
    expect(seed).toMatch(/localWoerdenMeta/)
  })
})

describe('local page Woerden/Utrecht: JSON-LD', () => {
  const url = 'https://rinsly.com'

  for (const locale of ['nl', 'en'] as const) {
    it(`${locale}: Service from Woerden, Utrecht province as remote area, no street address`, () => {
      const ld = buildLocalPageJsonLd(url, locale)
      expect(ld['@type']).toBe('Service')
      expect(ld['url']).toBe(`${url}/${locale}/${LOCAL_PAGE_SLUG}`)
      const json = JSON.stringify(ld)
      expect(json).toContain('Woerden')
      expect(json).toContain('"AdministrativeArea"')
      expect(json).toContain('Utrecht')
      expect(json).not.toContain('streetAddress')
      expect(json).not.toContain('Kazernestraat')
      expect(json).not.toContain('postalCode')
      const provider = ld['provider'] as Record<string, unknown>
      expect(provider).toEqual({ '@id': `${url}/#organization` })
      expect(json).not.toContain('PostalAddress')
      const channel = ld['availableChannel'] as Record<string, unknown>
      expect(channel['@type']).toBe('ServiceChannel')
      expect(String(channel['name'])).toMatch(locale === 'nl' ? /op afstand/i : /remote/i)
      expect(String(ld['description'])).toMatch(locale === 'nl' ? /op afstand/i : /remote/i)
      for (const re of BANNED) expect(json, String(re)).not.toMatch(re)
    })
  }
})
