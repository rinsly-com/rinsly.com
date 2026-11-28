import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { staticRedirectLines } from '../../scripts/staticRedirects.mjs'

import {
  UNSUBSCRIBE_ALL_CHANNELS_LINE_PENDING,
  UNSUBSCRIBE_COPY,
  UNSUBSCRIBE_COPY_STATUS,
} from '../../src/lib/unsubscribeCopy'
import { renderUnsubscribePage } from '../../src/lib/unsubscribePage'
import {
  applyUnsubscribeHeaders,
  UNSUBSCRIBE_HEADER_SOURCES,
  UNSUBSCRIBE_HTTP_HEADERS,
} from '../../src/lib/unsubscribeHeaders'
import {
  unsubscribeDocumentStatusRewrite,
  unsubscribeViewFromVerification,
} from '../../src/lib/unsubscribeDocumentStatus'
import { handleUnsubscribeRequest, parseUnsubscribePost } from '../../src/lib/unsubscribeRequest'
import { unsubscribePostRewrite } from '../../src/lib/unsubscribePostRewrite'
import { MemoryUnsubscribeStore, UnavailableUnsubscribeStore } from '../../src/lib/unsubscribeStore'
import { mintUnsubscribeToken } from '../../src/lib/unsubscribeToken'

const SECRET = 'test-secret-do-not-use-in-production'
const NOW = new Date('2026-11-27T22:00:00.000Z')
const RECIPIENT = 'person@example.com'

async function tokenFor(email = RECIPIENT) {
  return mintUnsubscribeToken(email, SECRET)
}

function assertNoRecipientEmail(html: string) {
  expect(html.toLowerCase()).not.toContain(RECIPIENT)
  const emails = html.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []
  expect(emails.every((address) => address === 'contact@rinsly.com')).toBe(true)
}

describe('unsubscribe copy', () => {
  it('is the Lawyer + Marketeer approved wording, in the je-form', () => {
    expect(UNSUBSCRIBE_COPY_STATUS).toBe('approved-lawyer-marketeer')
    expect(UNSUBSCRIBE_COPY.nl.confirm).toBe(
      'Wil je geen marketingberichten van Rinsly meer ontvangen?',
    )
    expect(UNSUBSCRIBE_COPY.nl.success).toBe(
      'Je bent afgemeld voor marketingberichten van Rinsly.',
    )
    expect(UNSUBSCRIBE_COPY.nl.invalid).toContain('Je kunt je ook afmelden')
    expect(UNSUBSCRIBE_COPY.nl.button).toBe('Ja, meld mij af')
    const nlText = Object.values(UNSUBSCRIBE_COPY.nl).join('\n')
    expect(nlText).not.toMatch(/\b[Uu]\b/)
    expect(nlText).not.toMatch(/\buw\b/i)
    expect(UNSUBSCRIBE_ALL_CHANNELS_LINE_PENDING).toBe(true)
  })
})

describe('parseUnsubscribePost', () => {
  it('accepts the RFC 8058 body, with or without a form content type', () => {
    expect(parseUnsubscribePost('List-Unsubscribe=One-Click', 'text/plain')).toEqual({
      kind: 'one-click',
    })
    expect(
      parseUnsubscribePost('List-Unsubscribe=One-Click', 'application/x-www-form-urlencoded'),
    ).toEqual({ kind: 'one-click' })
  })

  it('accepts the confirm form', () => {
    expect(
      parseUnsubscribePost('token=abc&confirm=1', 'application/x-www-form-urlencoded'),
    ).toEqual({ kind: 'confirm', token: 'abc' })
  })

  it('rejects an empty or unrelated body', () => {
    expect(parseUnsubscribePost('', 'application/x-www-form-urlencoded')).toEqual({ kind: 'unknown' })
    expect(parseUnsubscribePost('foo=bar', 'application/x-www-form-urlencoded')).toEqual({
      kind: 'unknown',
    })
  })
})

describe('handleUnsubscribeRequest', () => {
  it('GET with a valid token shows the confirm page and does not record an opt-out', async () => {
    const store = new MemoryUnsubscribeStore()
    const token = await tokenFor()
    const result = await handleUnsubscribeRequest({
      method: 'GET',
      token,
      locale: 'nl',
      body: '',
      contentType: '',
      secret: SECRET,
      store,
      now: NOW,
    })
    expect(result.status).toBe(200)
    expect(result.view).toBe('confirm')
    expect(result.body).toContain('Wil je geen marketingberichten van Rinsly meer ontvangen?')
    expect(result.body).toContain('Ja, meld mij af')
    expect(result.body).toContain('name="token"')
    expect(result.body).toContain('noindex, nofollow')
    assertNoRecipientEmail(result.body)
    expect(store.rows).toEqual([])
  })

  it('HEAD also leaves the store empty', async () => {
    const store = new MemoryUnsubscribeStore()
    const token = await tokenFor()
    const result = await handleUnsubscribeRequest({
      method: 'HEAD',
      token,
      locale: 'en',
      body: '',
      contentType: '',
      secret: SECRET,
      store,
      now: NOW,
    })
    expect(result.view).toBe('confirm')
    expect(result.body).toContain('Do you want to stop receiving marketing messages from Rinsly?')
    expect(store.rows).toEqual([])
  })

  it('GET with an invalid token returns 400 and the friendly invalid body', async () => {
    const store = new MemoryUnsubscribeStore()
    const result = await handleUnsubscribeRequest({
      method: 'GET',
      token: 'v1.not-a-real-hash.not-a-real-sig',
      locale: 'nl',
      body: '',
      contentType: '',
      secret: SECRET,
      store,
      now: NOW,
    })
    expect(result.status).toBe(400)
    expect(result.view).toBe('invalid')
    expect(result.body).toContain('contact@rinsly.com')
    expect(result.body).toContain('Je kunt je ook afmelden')
    expect(store.rows).toEqual([])
  })

  it('GET fails closed with 503 when the secret is missing', async () => {
    const store = new MemoryUnsubscribeStore()
    const token = await tokenFor()
    const result = await handleUnsubscribeRequest({
      method: 'GET',
      token,
      locale: 'nl',
      body: '',
      contentType: '',
      secret: '',
      store,
      now: NOW,
    })
    expect(result.status).toBe(503)
    expect(result.view).toBe('unavailable')
    expect(result.body).toContain('contact@rinsly.com')
    expect(result.body).toContain('Afmelden is nu niet mogelijk')
    expect(store.rows).toEqual([])
  })

  it('RFC 8058 POST unsubscribes directly, with a success body and no confirm button', async () => {
    const store = new MemoryUnsubscribeStore()
    const token = await tokenFor()
    const first = await handleUnsubscribeRequest({
      method: 'POST',
      token,
      locale: 'nl',
      body: 'List-Unsubscribe=One-Click',
      contentType: 'application/x-www-form-urlencoded',
      secret: SECRET,
      store,
      now: NOW,
    })
    expect(first.status).toBe(200)
    expect(first.view).toBe('success')
    expect(first.body).toContain('Je bent afgemeld voor marketingberichten van Rinsly.')
    expect(first.body).toContain('Je ontvangt alleen nog berichten die nodig zijn voor een lopende opdracht')
    expect(first.body).toContain('href="/nl/privacy"')
    expect(first.body).toContain('rinsly.com/nl/privacy')
    expect(first.body).toContain('Terug naar rinsly.com')
    expect(first.body).not.toContain('Ja, meld mij af')
    expect(first.body).not.toContain('name="confirm"')
    assertNoRecipientEmail(first.body)
    expect(store.rows).toHaveLength(1)
    expect(store.rows[0]).toMatchObject({
      source: 'one-click',
      locale: 'nl',
      optedOutAt: NOW.toISOString(),
      tokenVersion: 1,
    })
    expect(store.rows[0]?.emailHash).toMatch(/^[A-Za-z0-9_-]+$/)

    const second = await handleUnsubscribeRequest({
      method: 'POST',
      token,
      locale: 'en',
      body: 'List-Unsubscribe=One-Click',
      contentType: 'text/plain',
      secret: SECRET,
      store,
      now: new Date('2026-11-28T00:00:00.000Z'),
    })
    expect(second.status).toBe(200)
    expect(second.view).toBe('success')
    expect(second.body).toContain('You will only receive messages needed for an ongoing assignment')
    expect(second.body).toContain('href="/en/privacy"')
    expect(second.body).toContain('Back to rinsly.com')
    expect(second.body).not.toContain('Yes, unsubscribe me')
    expect(store.rows).toHaveLength(1)
  })

  it('POST confirm form records source confirm', async () => {
    const store = new MemoryUnsubscribeStore()
    const token = await tokenFor()
    const result = await handleUnsubscribeRequest({
      method: 'POST',
      token: '',
      locale: 'en',
      body: `token=${encodeURIComponent(token)}&confirm=1`,
      contentType: 'application/x-www-form-urlencoded',
      secret: SECRET,
      store,
      now: NOW,
    })
    expect(result.status).toBe(200)
    expect(result.view).toBe('success')
    expect(store.rows[0]?.source).toBe('confirm')
    assertNoRecipientEmail(result.body)
  })

  it('a no-JS confirm form POST records the opt-out and shows success', async () => {
    const formSrc = readFileSync('src/components/unsubscribe/UnsubscribeConfirmForm.tsx', 'utf8')
    expect(formSrc).toContain('method="post"')
    expect(formSrc).toContain('/${locale}/afmelden?token=${encodeURIComponent(token)}')
    expect(formSrc).toContain('name="token"')
    expect(formSrc).toContain('name="confirm"')
    expect(formSrc).not.toContain("'use client'")
    expect(formSrc).not.toContain('confirmUnsubscribeAction')
    expect(formSrc).not.toContain('useState')

    const store = new MemoryUnsubscribeStore()
    const token = await tokenFor()
    const result = await handleUnsubscribeRequest({
      method: 'POST',
      token: '',
      locale: 'nl',
      body: `token=${encodeURIComponent(token)}&confirm=1`,
      contentType: 'application/x-www-form-urlencoded',
      secret: SECRET,
      store,
      now: NOW,
    })
    expect(result.status).toBe(200)
    expect(result.view).toBe('success')
    expect(result.body).toContain('Je bent afgemeld voor marketingberichten van Rinsly.')
    expect(result.body).not.toContain('Ja, meld mij af')
    expect(result.body).not.toContain('name="confirm"')
    expect(store.rows).toHaveLength(1)
    expect(store.rows[0]?.source).toBe('confirm')
    assertNoRecipientEmail(result.body)
  })

  it('POST with an invalid token does not write and tells the visitor to use contact@', async () => {
    const store = new MemoryUnsubscribeStore()
    const result = await handleUnsubscribeRequest({
      method: 'POST',
      token: 'v1.not-a-real-hash.not-a-real-sig',
      locale: 'nl',
      body: 'List-Unsubscribe=One-Click',
      contentType: 'text/plain',
      secret: SECRET,
      store,
      now: NOW,
    })
    expect(result.status).toBe(400)
    expect(result.view).toBe('invalid')
    expect(result.body).toContain('contact@rinsly.com')
    expect(result.body).toContain('Je kunt je ook afmelden')
    expect(store.rows).toEqual([])
  })

  it('POST fails closed when the store is unavailable or the secret is missing', async () => {
    const token = await tokenFor()
    const unavailable = await handleUnsubscribeRequest({
      method: 'POST',
      token,
      locale: 'nl',
      body: 'List-Unsubscribe=One-Click',
      contentType: 'text/plain',
      secret: SECRET,
      store: new UnavailableUnsubscribeStore(),
      now: NOW,
    })
    expect(unavailable.status).toBe(503)
    expect(unavailable.view).toBe('unavailable')
    expect(unavailable.body).toContain('contact@rinsly.com')
    assertNoRecipientEmail(unavailable.body)

    const store = new MemoryUnsubscribeStore()
    const noSecret = await handleUnsubscribeRequest({
      method: 'POST',
      token,
      locale: 'nl',
      body: 'List-Unsubscribe=One-Click',
      contentType: 'text/plain',
      secret: '',
      store,
      now: NOW,
    })
    expect(noSecret.status).toBe(503)
    expect(noSecret.view).toBe('unavailable')
    expect(store.rows).toEqual([])
  })
})

describe('confirm button is only on the body-link GET page', () => {
  it('renders the confirm button on GET confirm, and never on success, invalid or unavailable', async () => {
    const token = await tokenFor()
    const confirm = renderUnsubscribePage({ locale: 'nl', view: 'confirm', token })
    expect(confirm).toContain('Ja, meld mij af')
    expect(confirm).toContain('<form method="post"')
    expect(confirm).toContain('min-height: 32px')
    expect(confirm).toContain('gap: 12px')
    assertNoRecipientEmail(confirm)

    for (const view of ['success', 'invalid', 'unavailable'] as const) {
      const html = renderUnsubscribePage({ locale: 'nl', view })
      expect(html).not.toContain('Ja, meld mij af')
      expect(html).not.toContain('name="confirm"')
      expect(html).toContain('noindex, nofollow')
      assertNoRecipientEmail(html)
    }

    const enSuccess = renderUnsubscribePage({ locale: 'en', view: 'success' })
    expect(enSuccess).not.toContain('Yes, unsubscribe me')
    expect(enSuccess).toContain('href="/en/privacy"')
    assertNoRecipientEmail(enSuccess)
  })
})

describe('unsubscribe POST rewrite', () => {
  it('rewrites RFC 8058 POST on /{locale}/afmelden, and ignores GET and server actions', () => {
    expect(
      unsubscribePostRewrite({ method: 'POST', pathname: '/nl/afmelden', hasNextAction: false }),
    ).toEqual({ locale: 'nl', rewritePath: '/nl/afmelden/one-click' })
    expect(
      unsubscribePostRewrite({ method: 'POST', pathname: '/en/afmelden/', hasNextAction: false }),
    ).toEqual({ locale: 'en', rewritePath: '/en/afmelden/one-click' })
    expect(
      unsubscribePostRewrite({ method: 'GET', pathname: '/nl/afmelden', hasNextAction: false }),
    ).toBeNull()
    expect(
      unsubscribePostRewrite({ method: 'POST', pathname: '/nl/afmelden', hasNextAction: true }),
    ).toBeNull()
    expect(
      unsubscribePostRewrite({ method: 'POST', pathname: '/nl/partner', hasNextAction: false }),
    ).toBeNull()
  })
})

describe('unsubscribe document status rewrite', () => {
  it('rewrites human GET/HEAD /{locale}/afmelden to 400 or 503, and leaves other paths alone', async () => {
    expect(
      await unsubscribeDocumentStatusRewrite({
        method: 'GET',
        pathname: '/nl/afmelden',
        token: 'v1.not-a-real-hash.not-a-real-sig',
        secret: SECRET,
      }),
    ).toEqual({ status: 400 })
    expect(
      await unsubscribeDocumentStatusRewrite({
        method: 'HEAD',
        pathname: '/en/afmelden/',
        token: 'not-a-token',
        secret: SECRET,
      }),
    ).toEqual({ status: 400 })
    const token = await tokenFor()
    expect(
      await unsubscribeDocumentStatusRewrite({
        method: 'GET',
        pathname: '/nl/afmelden',
        token,
        secret: '',
      }),
    ).toEqual({ status: 503 })
    expect(
      await unsubscribeDocumentStatusRewrite({
        method: 'GET',
        pathname: '/nl/afmelden',
        token,
        secret: SECRET,
      }),
    ).toBeNull()
    expect(
      await unsubscribeDocumentStatusRewrite({
        method: 'POST',
        pathname: '/nl/afmelden',
        token: 'v1.not-a-real-hash.not-a-real-sig',
        secret: SECRET,
      }),
    ).toBeNull()
    expect(
      await unsubscribeDocumentStatusRewrite({
        method: 'GET',
        pathname: '/afmelden',
        token: 'v1.not-a-real-hash.not-a-real-sig',
        secret: SECRET,
      }),
    ).toBeNull()
    expect(
      await unsubscribeDocumentStatusRewrite({
        method: 'GET',
        pathname: '/nl/afmelden/one-click',
        token: 'v1.not-a-real-hash.not-a-real-sig',
        secret: SECRET,
      }),
    ).toBeNull()
  })

  it('maps a failed verification to the same 400/503 codes as one-click', () => {
    expect(unsubscribeViewFromVerification({ ok: false, reason: 'invalid' })).toEqual({
      view: 'invalid',
      status: 400,
    })
    expect(unsubscribeViewFromVerification({ ok: false, reason: 'missing_secret' })).toEqual({
      view: 'unavailable',
      status: 503,
    })
  })
})

describe('unsubscribe HTTP headers', () => {
  it('sets Referrer-Policy: no-referrer and Cache-Control: no-store on GET and one-click', () => {
    expect(UNSUBSCRIBE_HTTP_HEADERS).toEqual([
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'Cache-Control', value: 'no-store' },
    ])
    const headers = new Headers()
    applyUnsubscribeHeaders(headers)
    expect(headers.get('Referrer-Policy')).toBe('no-referrer')
    expect(headers.get('Cache-Control')).toBe('no-store')

    expect(UNSUBSCRIBE_HEADER_SOURCES).toEqual([
      '/afmelden',
      '/afmelden/',
      '/:locale(nl|en)/afmelden',
      '/:locale(nl|en)/afmelden/',
      '/:locale(nl|en)/afmelden/one-click',
      '/:locale(nl|en)/afmelden/one-click/',
    ])

    const middleware = readFileSync('src/middleware.ts', 'utf8')
    expect(middleware).toContain('applyUnsubscribeHeaders')
    expect(middleware).toContain('unsubscribeDocumentStatusRewrite')
    expect(middleware).toContain('status: statusRewrite.status')
    expect(middleware).toContain('/nl/afmelden/:path*')
    expect(middleware).toContain('/en/afmelden/:path*')
    expect(middleware).toContain("'/afmelden'")
    expect(middleware).toContain("'/afmelden/'")

    const nextCfg = readFileSync('next.config.ts', 'utf8')
    expect(nextCfg).toContain('UNSUBSCRIBE_HTTP_HEADERS')
    expect(nextCfg).toContain('UNSUBSCRIBE_HEADER_SOURCES')
    const catchAllAt = nextCfg.indexOf("source: '/:path*'")
    const unsubSourcesAt = nextCfg.indexOf('...UNSUBSCRIBE_HEADER_SOURCES.map')
    expect(catchAllAt).toBeGreaterThan(-1)
    expect(unsubSourcesAt).toBeGreaterThan(catchAllAt)

    const oneClick = readFileSync(
      'src/app/(frontend)/[locale]/afmelden/one-click/route.ts',
      'utf8',
    )
    expect(oneClick).toContain('applyUnsubscribeHeaders')
  })
})

describe('static export, redirects and noindex', () => {
  it('stashes the afmelden route and middleware out of the static export', () => {
    const src = readFileSync('scripts/build-static.mjs', 'utf8')
    expect(src).toContain("'src/app/(frontend)/[locale]/afmelden'")
    expect(src).toContain("'src/middleware.ts'")
  })

  it('redirects bare /afmelden to the default locale, without making it permanent', () => {
    const lines = staticRedirectLines('nl', ['nl', 'en'])
    expect(lines).toContain('/afmelden    /nl/afmelden    302')
    const nextCfg = readFileSync('next.config.ts', 'utf8')
    expect(nextCfg).toContain("{ source: '/afmelden', destination: '/nl/afmelden', permanent: false }")
  })

  it('keeps the GET page noindex and out of the sitemap helper', () => {
    const page = readFileSync('src/app/(frontend)/[locale]/afmelden/page.tsx', 'utf8')
    expect(page).toContain('robots: { index: false, follow: false }')
    expect(page).toContain('resolveUnsubscribeDocument')
    const slugs = readFileSync('src/lib/sitemapSlugs.ts', 'utf8')
    expect(slugs).not.toContain('afmelden')
    const sitemap = readFileSync('src/app/sitemap.ts', 'utf8')
    expect(sitemap).not.toContain('afmelden')
  })
})
