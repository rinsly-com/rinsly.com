import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import { SeedAccpBlockedError } from '@rinsly-com/site-core/content'

import {
  InvalidHandoverFlagError,
  beginSeed,
  globalIsUnseeded,
  isBlank,
  localesToWrite,
  pageLocaleIsStub,
  pageLocaleNeedsSeed,
  parseHandoverFlag,
} from '../../scripts/seedLock'

/**
 * DF1: accp D1 is the source of truth for rinsly.com copy. The seed is a
 * bootstrap: it creates pages that do not exist, finishes incomplete locales
 * (draft-only, empty layout, a header/footer locale with no copy text), and
 * never rewrites a published locale that already has content.
 */
const layout = [{ blockType: 'hero' }]
const published = { layout, _status: 'published' as const }
const emptyDraft = { title: 'Prijzen', _status: 'draft' as const, layout: [] as unknown[] }

describe('pageLocaleIsStub / pageLocaleNeedsSeed', () => {
  it('treats a missing doc, a missing layout, or zero blocks as an unfinished stub', () => {
    expect(pageLocaleIsStub(null)).toBe(true)
    expect(pageLocaleIsStub(undefined)).toBe(true)
    expect(pageLocaleIsStub({})).toBe(true)
    expect(pageLocaleIsStub({ layout: null })).toBe(true)
    expect(pageLocaleIsStub({ layout: [] })).toBe(true)
    expect(pageLocaleIsStub(emptyDraft)).toBe(true)
    expect(pageLocaleNeedsSeed(null)).toBe(true)
    expect(pageLocaleNeedsSeed(emptyDraft)).toBe(true)
  })

  it('treats a draft-only locale (never published) as unseeded, even if the draft already has blocks', () => {
    // localesToWrite / pageLocaleNeedsSeed see the published doc only. No
    // published row means the locale is unfinished (crash after pass 2 wrote
    // draft layouts, or a title-only pass 1 stub).
    expect(pageLocaleNeedsSeed(null)).toBe(true)
    expect(pageLocaleNeedsSeed(undefined)).toBe(true)
  })

  it('leaves a published locale that already has layout blocks alone', () => {
    expect(pageLocaleIsStub(published)).toBe(false)
    expect(pageLocaleNeedsSeed(published)).toBe(false)
  })
})

describe('localesToWrite (create-only and stubs, per locale)', () => {
  const bothPublished = { nl: published, en: published }

  it('writes both locales for a row this run just created', () => {
    expect(localesToWrite(true, bothPublished)).toEqual({ nl: true, en: true })
    expect(localesToWrite(true, { nl: emptyDraft, en: null })).toEqual({ nl: true, en: true })
  })

  it('writes both locales of a title-only draft left by a crash between pass 1 and pass 2', () => {
    expect(localesToWrite(false, { nl: emptyDraft, en: emptyDraft })).toEqual({ nl: true, en: true })
    expect(localesToWrite(false, { nl: { title: 'Contact' }, en: undefined })).toEqual({ nl: true, en: true })
    expect(localesToWrite(false, { nl: null, en: null })).toEqual({ nl: true, en: true })
  })

  it('finishes a draft-only page that was never published (crash after layouts, before publish)', () => {
    expect(localesToWrite(false, { nl: null, en: null })).toEqual({ nl: true, en: true })
  })

  it('fills only the locale that is still unpublished or empty, and does not overwrite a published layout', () => {
    expect(localesToWrite(false, { nl: published, en: emptyDraft })).toEqual({ nl: false, en: true })
    expect(localesToWrite(false, { nl: published, en: null })).toEqual({ nl: false, en: true })
    expect(localesToWrite(false, { nl: emptyDraft, en: published })).toEqual({ nl: true, en: false })
  })

  it('writes nothing when both published locales already have layout blocks', () => {
    expect(localesToWrite(false, bothPublished)).toBeNull()
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

describe('globalIsUnseeded (per locale)', () => {
  it('fills a header that was never saved', () => {
    expect(globalIsUnseeded('header', { id: 1, navItems: [], cta: { label: null } })).toBe(true)
    expect(globalIsUnseeded('header', null)).toBe(true)
  })

  it('leaves a header with any nav or cta label alone', () => {
    expect(globalIsUnseeded('header', { navItems: [{ label: 'Platform' }] })).toBe(false)
    expect(globalIsUnseeded('header', { navItems: [], cta: { label: 'Contact' } })).toBe(false)
  })

  it('fills a footer that was never saved, and leaves an edited one alone', () => {
    expect(globalIsUnseeded('footer', { tagline: null, menuItems: [], infoLinks: [], copyright: '' })).toBe(true)
    expect(globalIsUnseeded('footer', { tagline: 'Uit Woerden.', menuItems: [] })).toBe(false)
    expect(globalIsUnseeded('footer', { copyright: '© Rinsly' })).toBe(false)
  })

  it('treats a locale that was never written as unseeded, even when the other locale has copy', () => {
    const nlHeader = { navItems: [{ label: 'Platform' }], cta: { label: 'Contact' } }
    const enHeaderEmpty = { navItems: [], cta: { label: null } }
    expect(globalIsUnseeded('header', nlHeader)).toBe(false)
    expect(globalIsUnseeded('header', enHeaderEmpty)).toBe(true)
    const nlFooter = { tagline: 'Uit Woerden.', menuItems: [{ label: 'Prijzen' }], infoLinks: [], copyright: '©' }
    const enFooterEmpty = { tagline: null, menuItems: [], infoLinks: [], copyright: '' }
    expect(globalIsUnseeded('footer', nlFooter)).toBe(false)
    expect(globalIsUnseeded('footer', enFooterEmpty)).toBe(true)
  })

  it('treats EN as unseeded when NL already wrote the shared nav rows but EN labels are still empty', () => {
    const enAfterNlWrite = {
      navItems: [
        { id: 'a', label: null, type: 'internal', page: 5 },
        { id: 'b', label: '', type: 'internal', page: 6 },
      ],
      cta: { id: 'c', label: null, type: 'internal', page: 9 },
    }
    expect(globalIsUnseeded('header', enAfterNlWrite)).toBe(true)
    expect(
      globalIsUnseeded('header', {
        navItems: [{ id: 'a', label: 'Platform', type: 'internal', page: 5 }],
        cta: { label: null, type: 'internal', page: 9 },
      }),
    ).toBe(false)
    expect(
      globalIsUnseeded('footer', {
        tagline: null,
        copyright: '',
        menuItems: [{ id: 'm', label: null, url: '/en/prijzen' }],
        infoLinks: [{ id: 'i', label: null, url: '/en/privacy' }],
      }),
    ).toBe(true)
  })

  it('treats an all-blank locale as truly unseeded (it is refilled), and keeps any locale with copy text', () => {
    expect(
      globalIsUnseeded('header', { navItems: [], cta: { label: '   ', type: 'internal' } }),
    ).toBe(true)
    expect(globalIsUnseeded('footer', { tagline: '  ', menuItems: [], infoLinks: [], copyright: '' })).toBe(true)
    expect(globalIsUnseeded('header', { navItems: [{ label: 'x' }], cta: { label: null } })).toBe(false)
  })
})

describe('parseHandoverFlag', () => {
  it.each([undefined, '', '   ', '0', 'false', 'no', 'False', 'NO', ' 0 '])(
    'treats %j as not handed over (default-open)',
    (value) => {
      expect(parseHandoverFlag(value)).toBe('off')
    },
  )

  it.each(['1', 'true', 'yes', 'TRUE', 'Yes', ' 1 '])('treats %j as handed over', (value) => {
    expect(parseHandoverFlag(value)).toBe('on')
  })

  it.each(['on', 'off', '2', 'maybe', 'enabled', 'y'])('fails closed on %j', (value) => {
    expect(() => parseHandoverFlag(value)).toThrow(InvalidHandoverFlagError)
    expect(() => parseHandoverFlag(value)).toThrow(/RINSLY_HANDED_OVER/)
  })
})

describe('beginSeed guard matrix (in-process, no database)', () => {
  const blocked = /seed-accp is blocked after handover/

  it.each([
    { command: 'seed-accp', env: { RINSLY_HANDED_OVER: '1' } },
    { command: 'seed-accp', env: { RINSLY_HANDED_OVER: 'true' } },
    { command: 'seed-accp', env: { RINSLY_HANDED_OVER: 'yes' } },
    { target: 'accp', env: { RINSLY_HANDED_OVER: '1' } },
    { env: { SEED_COMMAND: 'seed-accp', RINSLY_HANDED_OVER: '1' } },
    { env: { SEED_TARGET: 'accp', RINSLY_HANDED_OVER: 'YES' } },
    { env: { NODE_ENV: 'production', RINSLY_HANDED_OVER: '1' } },
    { env: { NODE_ENV: 'production', RINSLY_HANDED_OVER: 'true' } },
  ])('blocks a handed-over accp or production run: %j', (options) => {
    expect(() => beginSeed(options)).toThrow(SeedAccpBlockedError)
    expect(() => beginSeed(options)).toThrow(blocked)
  })

  it.each([
    { command: 'seed-accp', env: { RINSLY_HANDED_OVER: '0' } },
    { command: 'seed-accp', env: { RINSLY_HANDED_OVER: 'false' } },
    { command: 'seed-accp', env: { RINSLY_HANDED_OVER: 'no' } },
    { command: 'seed-accp', env: {} },
    { command: 'seed-accp', env: { RINSLY_HANDED_OVER: '' } },
    { env: { NODE_ENV: 'production', RINSLY_HANDED_OVER: '0' } },
    { env: { NODE_ENV: 'production' } },
    { env: { RINSLY_HANDED_OVER: 'yes' } },
    { env: { NODE_ENV: 'development', RINSLY_HANDED_OVER: '1' } },
  ])('allows a default-open accp/production run, or a local seed after handover: %j', (options) => {
    expect(() => beginSeed(options)).not.toThrow()
  })

  it('returns production: true only when NODE_ENV is production, so repair and admin promotion can be skipped', () => {
    expect(beginSeed({ env: { NODE_ENV: 'production', RINSLY_HANDED_OVER: '0' } }).production).toBe(true)
    expect(beginSeed({ command: 'seed-accp', env: { RINSLY_HANDED_OVER: '0' } }).production).toBe(false)
    expect(beginSeed({ env: {} }).production).toBe(false)
  })

  it('fails closed on an unknown flag, including "on", before any seed work', () => {
    expect(() => beginSeed({ command: 'seed-accp', env: { RINSLY_HANDED_OVER: 'on' } })).toThrow(
      InvalidHandoverFlagError,
    )
    expect(() => beginSeed({ env: { NODE_ENV: 'production', RINSLY_HANDED_OVER: 'maybe' } })).toThrow(
      InvalidHandoverFlagError,
    )
  })
})

describe('scripts/seed.ts uses beginSeed and the per-locale helpers', () => {
  const seed = readFileSync(new URL('../../scripts/seed.ts', import.meta.url), 'utf8')

  it('calls beginSeed first in run() and skips repair and admin promotion in production', () => {
    const run = seed.slice(seed.indexOf('async function run()'))
    const body = run.slice(run.indexOf('{') + 1)
    expect(body.trimStart().startsWith('const { production } = beginSeed()')).toBe(true)
    expect(run).toMatch(/if \(!production\) await repairOrphanedVersions\(payload\)/)
    expect(run).toMatch(/if \(!production && !user\.roles\.includes\('admin'\)\)/)
    expect(run.indexOf('beginSeed()')).toBeLessThan(run.indexOf('getPayload'))
    expect(run.indexOf('beginSeed()')).toBeLessThan(run.indexOf('repairOrphanedVersions'))
  })

  it('finishes stub locales through localesToWrite and fills each unseeded global locale', () => {
    const run = seed.slice(seed.indexOf('async function run()'))
    expect(run).toMatch(/localesToWrite\(/)
    expect(run).toMatch(/draft: false/)
    expect(run).toMatch(/globalIsUnseeded\(slug,/)
    expect(run).toMatch(/await seedGlobal\('header'/)
    expect(run).toMatch(/await seedGlobal\('footer'/)
    expect(run).toMatch(/findGlobal\(\{[\s\S]*?fallbackLocale: false/)
  })
})

describe('seed-accp.yml', () => {
  const wf = readFileSync(new URL('../../.github/workflows/seed-accp.yml', import.meta.url), 'utf8')

  it('tells the seed it is seed-accp and passes the handover flag', () => {
    expect(wf).toMatch(/SEED_COMMAND: seed-accp/)
    expect(wf).toMatch(/RINSLY_HANDED_OVER: \$\{\{ vars\.RINSLY_HANDED_OVER \}\}/)
  })
})
