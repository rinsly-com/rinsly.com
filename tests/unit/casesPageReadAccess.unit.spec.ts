import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { Access, AccessArgs, Where } from 'payload'

import { CASES_PAGE_SLUG } from '../../src/lib/casesPageFlag'
import {
  applyCasesPageReadAccess,
  casesPageAnonymousConstraint,
  casesPageReadAccess,
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

function userArgs(): AccessArgs {
  return { req: { user: { id: 'admin-1', email: 'dev@rinsly.local' } } } as unknown as AccessArgs
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

describe('casesPageAnonymousConstraint', () => {
  it('excludes the cases slug', () => {
    expect(casesPageAnonymousConstraint()).toEqual({ slug: { not_equals: CASES_PAGE_SLUG } })
    expect(CASES_PAGE_SLUG).toBe('cases')
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

  it('lets a signed-in user read cases while the flag is off', async () => {
    const read = casesPageReadAccess()
    await withFlag(undefined, async () => {
      expect(await read(userArgs())).toBe(true)
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
      expect(await casesPageReadAccess(publishedOnly)(userArgs())).toEqual({
        _status: { equals: 'published' },
      })
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
      expect(await wrapped.collections[1]?.access?.read?.(userArgs())).toBe(true)
    })
    await withFlag('1', async () => {
      expect(await wrapped.collections[1]?.access?.read?.(anonArgs())).toBe(true)
    })
    expect(wrapped.collections[1]?.access?.create).toBe(config.collections[1]?.access?.create)
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
    expect(envExampleSource).toMatch(/# RINSLY_CASES_PAGE_ENABLED=/)
    expect(envExampleSource).toMatch(/docs\/cases-page\.md/)
    expect(envExampleSource).not.toMatch(/^RINSLY_CASES_PAGE_ENABLED=/m)
  })
})
