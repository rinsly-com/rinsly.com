import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { globalIsUnseeded, isBlank, pagesToWrite } from '../../scripts/seedLock'

/**
 * DF1: accp D1 is the source of truth for rinsly.com copy. The seed is a
 * bootstrap: it creates pages that do not exist and fills globals that were
 * never saved, and it never rewrites a page or global that already has content.
 * Otherwise the next seed run would revert every content-endpoint or editor edit.
 */
describe('pagesToWrite', () => {
  const pages = [{ slug: 'home' }, { slug: 'prijzen' }, { slug: 'woerden' }]

  it('writes only pages this run created', () => {
    expect(pagesToWrite(pages, new Set(['woerden'])).map((p) => p.slug)).toEqual(['woerden'])
  })

  it('writes nothing when every page already exists', () => {
    expect(pagesToWrite(pages, new Set())).toEqual([])
  })

  it('writes every page on an empty database', () => {
    expect(pagesToWrite(pages, new Set(['home', 'prijzen', 'woerden']))).toEqual(pages)
  })
})

describe('isBlank', () => {
  it.each([[null], [undefined], [''], ['  '], [[]], [{}], [{ id: 'x', label: null, page: null }]])(
    'treats %j as blank',
    (value) => {
      expect(isBlank(value)).toBe(true)
    },
  )

  it.each([['Rinsly'], [0], [false], [[{ label: 'Platform' }]], [{ label: 'Contact' }]])(
    'treats %j as content',
    (value) => {
      expect(isBlank(value)).toBe(false)
    },
  )
})

describe('globalIsUnseeded', () => {
  it('fills a header that was never saved', () => {
    expect(globalIsUnseeded('header', { id: 1, navItems: [], cta: { label: null } })).toBe(true)
    expect(globalIsUnseeded('header', null)).toBe(true)
  })

  it('leaves a header with any nav item or cta alone', () => {
    expect(globalIsUnseeded('header', { navItems: [{ label: 'Platform' }] })).toBe(false)
    expect(globalIsUnseeded('header', { navItems: [], cta: { label: 'Contact' } })).toBe(false)
  })

  it('fills a footer that was never saved, and leaves an edited one alone', () => {
    expect(globalIsUnseeded('footer', { tagline: null, menuItems: [], infoLinks: [], copyright: '' })).toBe(true)
    expect(globalIsUnseeded('footer', { tagline: 'Uit Woerden.', menuItems: [] })).toBe(false)
    expect(globalIsUnseeded('footer', { copyright: '© Rinsly' })).toBe(false)
  })
})

describe('scripts/seed.ts wiring', () => {
  const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')
  const run = seed.slice(seed.indexOf('async function run()'))

  it('refuses a handed-over accp seed before any write', () => {
    const guard = run.indexOf('assertSeedAllowed(')
    expect(guard).toBeGreaterThan(-1)
    expect(guard).toBeLessThan(run.indexOf('payload.find('))
  })

  it('writes layouts only through pagesToWrite and globals only when unseeded', () => {
    expect(run).toMatch(/for \(const page of pagesToWrite\(sitePages, created\)\)/)
    expect(run).not.toMatch(/for \(const page of sitePages\) \{\s*for \(const locale/)
    for (const slug of ['header', 'footer']) {
      expect(run).toMatch(new RegExp(`globalIsUnseeded\\('${slug}'`))
    }
  })
})

describe('seed-accp.yml', () => {
  const wf = readFileSync(new URL('../../.github/workflows/seed-accp.yml', import.meta.url), 'utf8')

  it('tells the seed it is seed-accp and passes the handover flag', () => {
    expect(wf).toMatch(/SEED_COMMAND: seed-accp/)
    expect(wf).toMatch(/RINSLY_HANDED_OVER: \$\{\{ vars\.RINSLY_HANDED_OVER \}\}/)
  })
})
