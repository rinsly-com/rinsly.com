import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Access, AccessArgs, Where } from 'payload'

import { CASES_PAGE_SLUG } from '../../src/lib/casesPageFlag'
import {
  applyCasesPageReadAccess,
  CASES_PAGE_BLOCK_ANCHORS,
  casesPageAfterOperation,
  casesPageAnonymousConstraint,
  casesPageReadAccess,
  casesPageVersionsReadAccess,
  HIDDEN_CASES_SCAN_OPTIONS,
  isCmsStaffUser,
  isHiddenCasesDocument,
  resolveHiddenCasesIds,
} from '../../src/lib/casesPageReadAccess'

const payloadConfigSource = readFileSync(
  new URL('../../src/payload.config.ts', import.meta.url),
  'utf8',
)
const deployProdSource = readFileSync(
  new URL('../../.github/workflows/deploy-prod.yml', import.meta.url),
  'utf8',
)
const envExampleSource = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8')
const wranglerSource = readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8')
const docsSource = readFileSync(new URL('../../docs/cases-page.md', import.meta.url), 'utf8')

function anonArgs(): AccessArgs {
  return { req: { user: null } } as unknown as AccessArgs
}

function staffArgs(roles: string[] = ['admin']): AccessArgs {
  return {
    req: { user: { id: 'admin-1', email: 'dev@rinsly.local', collection: 'users', roles } },
  } as unknown as AccessArgs
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

const casesLayout = [{ blockType: 'services', anchor: 'burojazz' }]
const renamedCases = { id: 6, slug: 'cases-renamed', layout: casesLayout }
const ordinaryPage = { id: 7, slug: 'over', layout: [{ blockType: 'hero', anchor: 'intro' }] }

describe('isHiddenCasesDocument', () => {
  it('matches the cases slug and still matches after a slug rename when a seeded anchor remains', () => {
    expect(CASES_PAGE_BLOCK_ANCHORS).toEqual(['burojazz', 'up2brand'])
    expect(isHiddenCasesDocument({ slug: 'cases', layout: [] })).toBe(true)
    expect(isHiddenCasesDocument(renamedCases)).toBe(true)
    expect(isHiddenCasesDocument({ slug: 'cases-renamed', layout: [{ anchor: 'up2brand' }] })).toBe(
      true,
    )
    expect(isHiddenCasesDocument(ordinaryPage)).toBe(false)
    expect(isHiddenCasesDocument({ slug: 'over' })).toBe(false)
    expect(isHiddenCasesDocument(null)).toBe(false)
  })

  it('matches a locale-all layout when only a non-default locale still has the anchors', () => {
    const afterNlEdit = {
      slug: 'cases-renamed',
      layout: {
        nl: [{ blockType: 'hero', anchor: 'intro' }],
        en: [{ blockType: 'services', anchor: 'burojazz' }],
      },
    }
    expect(isHiddenCasesDocument(afterNlEdit)).toBe(true)
    expect(
      isHiddenCasesDocument({
        slug: 'over',
        layout: { nl: [{ anchor: 'intro' }], en: [{ anchor: 'intro' }] },
      }),
    ).toBe(false)
  })
})

describe('casesPageAnonymousConstraint', () => {
  it('excludes the cases slug, and also known ids so a rename cannot unhide the row', () => {
    expect(casesPageAnonymousConstraint()).toEqual({ slug: { not_equals: CASES_PAGE_SLUG } })
    expect(CASES_PAGE_SLUG).toBe('cases')
    expect(casesPageAnonymousConstraint([6, 'abc'])).toEqual({
      and: [{ slug: { not_equals: 'cases' } }, { id: { not_in: [6, 'abc'] } }],
    } satisfies Where)
  })
})

describe('isCmsStaffUser', () => {
  it('allows users-collection admin or editor, and rejects other roles or collections', () => {
    expect(isCmsStaffUser({ collection: 'users', roles: ['admin'] })).toBe(true)
    expect(isCmsStaffUser({ collection: 'users', roles: ['editor'] })).toBe(true)
    expect(isCmsStaffUser({ collection: 'users', roles: ['admin', 'editor'] })).toBe(true)
    expect(isCmsStaffUser({ collection: 'users', roles: ['reviewer'] })).toBe(false)
    expect(isCmsStaffUser({ collection: 'users', roles: ['author'] })).toBe(false)
    expect(isCmsStaffUser({ collection: 'users', roles: [] })).toBe(false)
    expect(isCmsStaffUser({ collection: 'users' })).toBe(false)
    expect(isCmsStaffUser({ collection: 'partners', roles: ['admin'] })).toBe(false)
    expect(isCmsStaffUser({ id: 'u-1' })).toBe(false)
    expect(isCmsStaffUser(null)).toBe(false)
  })
})

describe('casesPageReadAccess', () => {
  it('hides cases from anonymous readers when the flag is off', async () => {
    const read = casesPageReadAccess()
    await withFlag(undefined, async () => {
      expect(await read(anonArgs())).toEqual({ slug: { not_equals: 'cases' } })
    })
    await withFlag('', async () => {
      expect(await read(anonArgs())).toEqual({ slug: { not_equals: 'cases' } })
    })
    await withFlag('0', async () => {
      expect(await read(anonArgs())).toEqual({ slug: { not_equals: 'cases' } })
    })
  })

  it('hides a renamed cases document by id when hidden ids are resolved', async () => {
    const read = casesPageReadAccess(undefined, { resolveHiddenIds: () => [6] })
    await withFlag(undefined, async () => {
      expect(await read(anonArgs())).toEqual({
        and: [{ slug: { not_equals: 'cases' } }, { id: { not_in: [6] } }],
      } satisfies Where)
    })
  })

  it('allows anonymous reads when the flag is on', async () => {
    const read = casesPageReadAccess()
    await withFlag('1', async () => {
      expect(await read(anonArgs())).toBe(true)
    })
    await withFlag('true', async () => {
      expect(await read(anonArgs())).toBe(true)
    })
    await withFlag('YES', async () => {
      expect(await read(anonArgs())).toBe(true)
    })
  })

  it('treats a non-staff login like an anonymous reader', async () => {
    const partner = {
      req: { user: { id: 'p-1', email: 'p@x.nl', collection: 'partners', roles: ['admin'] } },
    } as unknown as AccessArgs
    const noCollection = { req: { user: { id: 'u-1', roles: ['admin'] } } } as unknown as AccessArgs
    const usersNoRole = staffArgs([])
    await withFlag(undefined, async () => {
      expect(await casesPageReadAccess()(partner)).toEqual({ slug: { not_equals: 'cases' } })
      expect(await casesPageReadAccess()(noCollection)).toEqual({ slug: { not_equals: 'cases' } })
      expect(await casesPageReadAccess()(usersNoRole)).toEqual({ slug: { not_equals: 'cases' } })
    })
  })

  it('lets a signed-in admin or editor read cases while the flag is off', async () => {
    const read = casesPageReadAccess()
    await withFlag(undefined, async () => {
      expect(await read(staffArgs(['admin']))).toBe(true)
      expect(await read(staffArgs(['editor']))).toBe(true)
    })
  })

  it('keeps a previous deny and ANDs a previous where clause for anonymous readers', async () => {
    const deny: Access = () => false
    const publishedOnly: Access = () => ({ _status: { equals: 'published' } })
    await withFlag(undefined, async () => {
      expect(await casesPageReadAccess(deny)(anonArgs())).toBe(false)
      expect(await casesPageReadAccess(publishedOnly)(anonArgs())).toEqual({
        and: [{ _status: { equals: 'published' } }, { slug: { not_equals: 'cases' } }],
      } satisfies Where)
    })
    await withFlag('1', async () => {
      expect(await casesPageReadAccess(publishedOnly)(anonArgs())).toEqual({
        _status: { equals: 'published' },
      })
    })
    await withFlag(undefined, async () => {
      expect(await casesPageReadAccess(publishedOnly)(staffArgs())).toEqual({
        _status: { equals: 'published' },
      })
    })
  })
})

describe('casesPageAfterOperation', () => {
  const req = () => ({ user: anonArgs().req.user })
  const staffReq = () => ({ user: staffArgs(['editor']).req.user })

  it('filters a renamed cases document out of a find result, and 404s findByID', async () => {
    const listed = {
      docs: [ordinaryPage, renamedCases],
      totalDocs: 2,
    }
    const filtered = await casesPageAfterOperation({
      operation: 'find',
      result: listed,
      req: req(),
    })
    expect(filtered).toEqual({ docs: [ordinaryPage], totalDocs: 1 })
    expect(
      await casesPageAfterOperation({
        operation: 'find',
        result: { docs: [ordinaryPage], totalDocs: 1 },
        req: req(),
      }),
    ).toEqual({ docs: [ordinaryPage], totalDocs: 1 })
    await expect(
      casesPageAfterOperation({ operation: 'findByID', result: renamedCases, req: req() }),
    ).rejects.toThrow()
  })

  it('returns the cases document for staff, or when the flag is on', async () => {
    await withFlag(undefined, async () => {
      expect(
        await casesPageAfterOperation({
          operation: 'findByID',
          result: renamedCases,
          req: staffReq(),
        }),
      ).toEqual(renamedCases)
    })
    await withFlag('1', async () => {
      expect(
        await casesPageAfterOperation({
          operation: 'findByID',
          result: renamedCases,
          req: req(),
        }),
      ).toEqual(renamedCases)
    })
  })

  it('recounts so a missed hidden id cannot leak +1 on count', async () => {
    const find = () => Promise.resolve({ docs: [renamedCases, ordinaryPage] })
    const count = (opts: { where?: Where; overrideAccess?: boolean; locale?: string }) => {
      expect(opts.overrideAccess).toBe(true)
      expect(opts.locale).toBe('all')
      expect(opts.where).toEqual({
        and: [
          { _status: { equals: 'published' } },
          { and: [{ slug: { not_equals: 'cases' } }, { id: { not_in: [6] } }] },
        ],
      })
      return Promise.resolve({ totalDocs: 10 })
    }
    const recounted = await casesPageAfterOperation({
      operation: 'count',
      result: { totalDocs: 11 },
      req: { user: null, payload: { find, count } },
      args: { where: { _status: { equals: 'published' } } },
    })
    expect(recounted).toEqual({ totalDocs: 10 })
  })

  it('leaves count alone for staff, overrideAccess, or when the flag is on', async () => {
    const leak = { totalDocs: 11 }
    expect(
      await casesPageAfterOperation({
        operation: 'count',
        result: leak,
        req: staffReq(),
      }),
    ).toEqual(leak)
    expect(
      await casesPageAfterOperation({
        operation: 'count',
        result: leak,
        req: req(),
        overrideAccess: true,
      }),
    ).toEqual(leak)
    await withFlag('1', async () => {
      expect(
        await casesPageAfterOperation({
          operation: 'count',
          result: leak,
          req: req(),
        }),
      ).toEqual(leak)
    })
  })
})

describe('resolveHiddenCasesIds', () => {
  it('scans every locale at depth 0 without a 200-row cap', () => {
    expect(HIDDEN_CASES_SCAN_OPTIONS).toEqual({
      collection: 'pages',
      locale: 'all',
      depth: 0,
      pagination: false,
      overrideAccess: true,
    })
  })

  it('keeps a document whose anchors remain only in a non-default locale', async () => {
    const docs = [
      {
        id: 6,
        slug: 'cases-renamed',
        layout: {
          nl: [{ blockType: 'hero', anchor: 'intro' }],
          en: [{ blockType: 'services', anchor: 'burojazz' }],
        },
      },
      ordinaryPage,
    ]
    const find = (opts: Record<string, unknown>) => {
      expect(opts).toMatchObject({
        collection: 'pages',
        locale: 'all',
        depth: 0,
        pagination: false,
        overrideAccess: true,
      })
      expect(opts).not.toHaveProperty('limit')
      return Promise.resolve({ docs })
    }
    const ids = await resolveHiddenCasesIds({
      req: { payload: { find } },
    } as unknown as AccessArgs)
    expect(ids).toEqual([6])
  })

  it('returns an empty list when payload is missing', async () => {
    expect(await resolveHiddenCasesIds(anonArgs())).toEqual([])
  })
})

describe('casesPageVersionsReadAccess', () => {
  it('denies version reads to anonymous, partners, and non-staff roles', async () => {
    const access = casesPageVersionsReadAccess()
    expect(await access({ req: { user: null } } as unknown as AccessArgs)).toBe(false)
    expect(
      await access({
        req: { user: { collection: 'users', roles: ['reviewer'] } },
      } as unknown as AccessArgs),
    ).toBe(false)
    expect(
      await access({
        req: { user: { collection: 'users', roles: ['author'] } },
      } as unknown as AccessArgs),
    ).toBe(false)
    expect(
      await access({
        req: { user: { collection: 'partners', roles: ['admin'] } },
      } as unknown as AccessArgs),
    ).toBe(false)
  })

  it('allows CMS staff to read versions, and still honours a previous deny', async () => {
    expect(await casesPageVersionsReadAccess()(staffArgs(['admin']))).toBe(true)
    expect(await casesPageVersionsReadAccess()(staffArgs(['editor']))).toBe(true)
    expect(await casesPageVersionsReadAccess(() => false)(staffArgs(['admin']))).toBe(false)
    await withFlag('1', async () => {
      expect(
        await casesPageVersionsReadAccess()({ req: { user: null } } as unknown as AccessArgs),
      ).toBe(false)
    })
  })
})

describe('applyCasesPageReadAccess', () => {
  it('wraps the pages collection read rule and leaves other collections alone', async () => {
    const mediaRead: Access = () => true
    const config = {
      collections: [
        { slug: 'media', access: { read: mediaRead } },
        { slug: 'pages', access: { read: (() => true) satisfies Access, create: () => false } },
      ],
    }
    const wrapped = applyCasesPageReadAccess(config)
    expect(wrapped.collections[0]?.access?.read).toBe(mediaRead)
    await withFlag(undefined, async () => {
      expect(await wrapped.collections[1]?.access?.read?.(anonArgs())).toEqual({
        slug: { not_equals: 'cases' },
      })
      expect(await wrapped.collections[1]?.access?.read?.(staffArgs())).toBe(true)
    })
    await withFlag('1', async () => {
      expect(await wrapped.collections[1]?.access?.read?.(anonArgs())).toBe(true)
    })
    expect(wrapped.collections[1]?.access?.create).toBe(config.collections[1]?.access?.create)
    const pagesAccess = wrapped.collections[1]?.access as { readVersions?: Access }
    expect(typeof pagesAccess.readVersions).toBe('function')
    await withFlag(undefined, async () => {
      expect(await pagesAccess.readVersions?.(anonArgs())).toBe(false)
      expect(await pagesAccess.readVersions?.(staffArgs())).toBe(true)
    })
    const pagesHooks = (wrapped.collections[1] as { hooks?: { afterOperation?: unknown } }).hooks
    expect(pagesHooks?.afterOperation).toEqual([casesPageAfterOperation])
  })

  it('throws when the pages collection is missing', () => {
    expect(() => applyCasesPageReadAccess({ collections: [{ slug: 'media' }] })).toThrow(
      /pages collection is missing/,
    )
    expect(() => applyCasesPageReadAccess({})).toThrow(/collections is missing/)
  })
})

describe('wiring', () => {
  it('applies the pages read wrapper from payload.config.ts', () => {
    expect(payloadConfigSource).toMatch(/applyCasesPageReadAccess/)
    expect(payloadConfigSource).toMatch(
      /buildSiteConfig\([\s\S]*\)\.then\(applyCasesPageReadAccess\)/,
    )
  })

  it('passes the flag into the prod static build from a repo var, default off', () => {
    expect(deployProdSource).toMatch(
      /RINSLY_CASES_PAGE_ENABLED:\s*\$\{\{\s*vars\.RINSLY_CASES_PAGE_ENABLED\s*\}\}/,
    )
    const wranglerWithoutComments = wranglerSource.replace(/\/\/.*$/gm, '')
    expect(wranglerWithoutComments).not.toContain('RINSLY_CASES_PAGE_ENABLED')
  })

  it('documents re-enable steps and keeps .env.example default off', () => {
    expect(docsSource).toMatch(/RINSLY_CASES_PAGE_ENABLED/)
    expect(docsSource).toMatch(/Worker/)
    expect(docsSource).toMatch(/vars\.RINSLY_CASES_PAGE_ENABLED|Actions variable/)
    expect(docsSource).toMatch(/wrangler\.jsonc/)
    expect(docsSource).toMatch(/GraphQL/)
    expect(docsSource).not.toMatch(/GraphQL if enabled/)
    expect(docsSource).toMatch(/burojazz/)
    expect(envExampleSource).toMatch(/# RINSLY_CASES_PAGE_ENABLED=/)
    expect(envExampleSource).toMatch(/docs\/cases-page\.md/)
    expect(envExampleSource).not.toMatch(/^RINSLY_CASES_PAGE_ENABLED=/m)
  })
})
