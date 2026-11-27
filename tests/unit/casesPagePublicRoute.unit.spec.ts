import { describe, expect, it } from 'vitest'
import type { Where } from 'payload'

import {
  excludeHiddenCasesParams,
  isCasesPublicRouteHidden,
} from '../../src/lib/casesPagePublicRoute'

async function withEnv<T>(
  _name: 'CONTENT_SNAPSHOT',
  value: string | undefined,
  run: () => Promise<T> | T,
): Promise<T> {
  const previous = process.env.CONTENT_SNAPSHOT
  if (value === undefined) delete process.env.CONTENT_SNAPSHOT
  else process.env.CONTENT_SNAPSHOT = value
  try {
    return await run()
  } finally {
    if (previous === undefined) delete process.env.CONTENT_SNAPSHOT
    else process.env.CONTENT_SNAPSHOT = previous
  }
}

async function withFlag<T>(value: string | undefined, run: () => Promise<T> | T): Promise<T> {
  const previous = process.env.RINSLY_CASES_PAGE_ENABLED
  if (value === undefined) delete process.env.RINSLY_CASES_PAGE_ENABLED
  else process.env.RINSLY_CASES_PAGE_ENABLED = value
  try {
    return await run()
  } finally {
    if (previous === undefined) delete process.env.RINSLY_CASES_PAGE_ENABLED
    else process.env.RINSLY_CASES_PAGE_ENABLED = previous
  }
}

const renamedCases = {
  id: 6,
  slug: 'cases-renamed',
  layout: {
    nl: [{ blockType: 'hero', anchor: 'intro' }],
    en: [{ blockType: 'services', anchor: 'burojazz' }],
  },
}
const ordinaryPage = { id: 7, slug: 'over', layout: [{ blockType: 'hero', anchor: 'intro' }] }

function payloadFor(docs: Array<{ id: number; slug: string; layout: unknown }>) {
  return {
    find: (opts: { locale?: string; depth?: number; pagination?: boolean; where?: Where }) => {
      if (opts.where && typeof opts.where === 'object' && 'slug' in opts.where) {
        const slug = (opts.where as { slug?: { equals?: string } }).slug?.equals
        return Promise.resolve({ docs: docs.filter((doc) => doc.slug === slug) })
      }
      expect(opts.locale).toBe('all')
      expect(opts.depth).toBe(0)
      expect(opts.pagination).toBe(false)
      return Promise.resolve({ docs })
    },
  }
}

const loaderFor = (docs: Array<{ id: number; slug: string; layout: unknown }>) => () =>
  Promise.resolve(payloadFor(docs))
const failingLoader = () => Promise.reject(new Error('D1_ERROR: no such table: pages'))

describe('isCasesPublicRouteHidden', () => {
  it('hides the cases slug and a renamed document whose anchors remain in one locale', async () => {
    const load = loaderFor([renamedCases, ordinaryPage])
    await withFlag(undefined, async () => {
      expect(await isCasesPublicRouteHidden('cases', load)).toBe(true)
      expect(await isCasesPublicRouteHidden('cases-renamed', load)).toBe(true)
      expect(await isCasesPublicRouteHidden('over', load)).toBe(false)
    })
    await withFlag('1', async () => {
      expect(await isCasesPublicRouteHidden('cases', load)).toBe(false)
      expect(await isCasesPublicRouteHidden('cases-renamed', load)).toBe(false)
    })
  })

  it('fails closed at runtime: no payload instance means hidden, a failing lookup throws', async () => {
    await withFlag(undefined, async () => {
      expect(await isCasesPublicRouteHidden('over', () => Promise.resolve(null))).toBe(true)
      await expect(isCasesPublicRouteHidden('over', failingLoader)).rejects.toThrow(/no such table/)
    })
  })

  it('skips the DB only in the snapshot build, and still hides the cases slug there', async () => {
    await withFlag(undefined, () =>
      withEnv('CONTENT_SNAPSHOT', '/tmp/snap', async () => {
        expect(await isCasesPublicRouteHidden('cases', failingLoader)).toBe(true)
        expect(await isCasesPublicRouteHidden('over', failingLoader)).toBe(false)
      }),
    )
  })
})

describe('excludeHiddenCasesParams', () => {
  const params = [
    { locale: 'nl', slug: 'over' },
    { locale: 'en', slug: 'over' },
    { locale: 'nl', slug: 'cases' },
    { locale: 'en', slug: 'cases' },
    { locale: 'nl', slug: 'cases-renamed' },
    { locale: 'en', slug: 'cases-renamed' },
  ]
  const onlyOver = [
    { locale: 'nl', slug: 'over' },
    { locale: 'en', slug: 'over' },
  ]
  const slugOnly = params.filter((entry) => entry.slug !== 'cases')

  it('drops the cases slug and a renamed cases document from static params', async () => {
    await withFlag(undefined, async () => {
      expect(
        await excludeHiddenCasesParams(params, loaderFor([renamedCases, ordinaryPage])),
      ).toEqual(onlyOver)
    })
    await withFlag('1', async () => {
      expect(await excludeHiddenCasesParams(params, loaderFor([renamedCases]))).toEqual(params)
    })
  })

  it('never depends on the DB at build time: a failing scan falls back to the slug-only exclude', async () => {
    await withFlag(undefined, async () => {
      expect(await excludeHiddenCasesParams(params, failingLoader)).toEqual(slugOnly)
      expect(await excludeHiddenCasesParams(params, () => Promise.resolve(null))).toEqual(slugOnly)
    })
  })

  it('does not touch the DB for a snapshot build or empty params', async () => {
    let calls = 0
    const spy = () => {
      calls += 1
      return failingLoader()
    }
    await withFlag(undefined, async () => {
      expect(await excludeHiddenCasesParams([], spy)).toEqual([])
      await withEnv('CONTENT_SNAPSHOT', '/tmp/snap', async () => {
        expect(await excludeHiddenCasesParams(params, spy)).toEqual(slugOnly)
      })
    })
    expect(calls).toBe(0)
  })
})
