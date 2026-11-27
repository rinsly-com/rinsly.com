import { describe, expect, it } from 'vitest'
import type { Where } from 'payload'

import {
  excludeHiddenCasesParams,
  isCasesPublicRouteHidden,
} from '../../src/lib/casesPagePublicRoute'

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
    find: (opts: {
      locale?: string
      depth?: number
      pagination?: boolean
      where?: Where
    }) => {
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

describe('isCasesPublicRouteHidden', () => {
  it('hides the cases slug and a renamed document whose anchors remain in one locale', async () => {
    const payload = payloadFor([renamedCases, ordinaryPage])
    await withFlag(undefined, async () => {
      expect(await isCasesPublicRouteHidden('cases', payload)).toBe(true)
      expect(await isCasesPublicRouteHidden('cases-renamed', payload)).toBe(true)
      expect(await isCasesPublicRouteHidden('over', payload)).toBe(false)
    })
    await withFlag('1', async () => {
      expect(await isCasesPublicRouteHidden('cases', payload)).toBe(false)
      expect(await isCasesPublicRouteHidden('cases-renamed', payload)).toBe(false)
    })
  })
})

describe('excludeHiddenCasesParams', () => {
  it('drops the cases slug and a renamed cases document from static params', async () => {
    const params = [
      { locale: 'nl', slug: 'over' },
      { locale: 'en', slug: 'over' },
      { locale: 'nl', slug: 'cases' },
      { locale: 'en', slug: 'cases' },
      { locale: 'nl', slug: 'cases-renamed' },
      { locale: 'en', slug: 'cases-renamed' },
    ]
    await withFlag(undefined, async () => {
      expect(
        await excludeHiddenCasesParams(params, payloadFor([renamedCases, ordinaryPage])),
      ).toEqual([
        { locale: 'nl', slug: 'over' },
        { locale: 'en', slug: 'over' },
      ])
    })
    await withFlag('1', async () => {
      expect(await excludeHiddenCasesParams(params, payloadFor([renamedCases]))).toEqual(params)
    })
  })
})
