import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  CASES_PAGE_FLAG,
  CASES_PAGE_SLUG,
  isCasesPageEnabled,
  isCasesPageHidden,
} from '../../src/lib/casesPageFlag'

const pageSource = readFileSync(
  new URL('../../src/app/(frontend)/[locale]/[slug]/page.tsx', import.meta.url),
  'utf8',
)
const ogSource = readFileSync(
  new URL('../../src/app/(frontend)/[locale]/[slug]/opengraph-image.tsx', import.meta.url),
  'utf8',
)
const headerFooterSeed = (() => {
  const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')
  const start = seed.indexOf('const headerData')
  const end = seed.indexOf('const footerShared')
  if (start < 0 || end < start) throw new Error('header/footer seed slice not found')
  return seed.slice(start, end)
})()

describe('isCasesPageEnabled', () => {
  it('is off unless the value is 1, true, or yes', () => {
    expect(isCasesPageEnabled('')).toBe(false)
    expect(isCasesPageEnabled('0')).toBe(false)
    expect(isCasesPageEnabled('false')).toBe(false)
    expect(isCasesPageEnabled('off')).toBe(false)
    expect(isCasesPageEnabled('no')).toBe(false)
    expect(isCasesPageEnabled('1')).toBe(true)
    expect(isCasesPageEnabled('true')).toBe(true)
    expect(isCasesPageEnabled('YES')).toBe(true)
    expect(isCasesPageEnabled(' True ')).toBe(true)
  })
})

describe('isCasesPageHidden', () => {
  it('404s the cases slug until the flag is on, and leaves every other slug alone', () => {
    expect(CASES_PAGE_SLUG).toBe('cases')
    expect(CASES_PAGE_FLAG).toBe('RINSLY_CASES_PAGE_ENABLED')
    expect(isCasesPageHidden('cases')).toBe(true)
    expect(isCasesPageHidden('cases', '')).toBe(true)
    expect(isCasesPageHidden('cases', '0')).toBe(true)
    expect(isCasesPageHidden('cases', 'true')).toBe(false)
    expect(isCasesPageHidden('cases', '1')).toBe(false)
    expect(isCasesPageHidden('website-laten-maken-woerden')).toBe(false)
    expect(isCasesPageHidden('website-laten-maken-woerden', '')).toBe(false)
    expect(isCasesPageHidden('over', '')).toBe(false)
    expect(isCasesPageHidden(undefined)).toBe(false)
  })
})

describe('cases public route', () => {
  it('404s /cases and a renamed cases document from the slug page and OG image until the flag is on', () => {
    expect(pageSource).toMatch(/isCasesPublicRouteHidden/)
    expect(pageSource).toMatch(/excludeHiddenCasesParams/)
    expect(pageSource).toMatch(/notFound\(/)
    expect(pageSource).toMatch(/generateStaticParams/)
    expect(pageSource).toMatch(/generateMetadata/)
    expect(ogSource).toMatch(/isCasesPublicRouteHidden/)
    expect(ogSource).toMatch(/excludeHiddenCasesParams/)
    expect(ogSource).toMatch(/notFound\(/)
    expect(pageSource).not.toMatch(/isCasesPageHidden\(/)
    expect(ogSource).not.toMatch(/isCasesPageHidden\(/)
  })

  it('has no header or footer nav link to /cases', () => {
    expect(headerFooterSeed).not.toMatch(/SLUG\.cases/)
    expect(headerFooterSeed).not.toMatch(/\/cases\b/)
  })
})
