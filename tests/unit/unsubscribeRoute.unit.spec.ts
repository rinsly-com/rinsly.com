import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { staticRedirectLines } from '../../scripts/staticRedirects.mjs'

import { UNSUBSCRIBE_COPY, UNSUBSCRIBE_COPY_STATUS } from '../../src/lib/unsubscribeCopy'
import { handleUnsubscribeRequest, parseUnsubscribePost } from '../../src/lib/unsubscribeRequest'
import { MemoryUnsubscribeStore, UnavailableUnsubscribeStore } from '../../src/lib/unsubscribeStore'
import { mintUnsubscribeToken } from '../../src/lib/unsubscribeToken'

const SECRET = 'test-secret-do-not-use-in-production'
const NOW = new Date('2026-11-27T22:00:00.000Z')

async function tokenFor(email = 'person@example.com') {
  return mintUnsubscribeToken(email, SECRET)
}

describe('unsubscribe copy', () => {
  it('is flagged as pending Lawyer and Marketeer confirmation', () => {
    expect(UNSUBSCRIBE_COPY_STATUS).toBe('pending-lawyer-marketeer')
    expect(UNSUBSCRIBE_COPY.nl.button).toContain('meld mij af')
    expect(UNSUBSCRIBE_COPY.en.button.toLowerCase()).toContain('unsubscribe')
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
    expect(result.body).toContain('Wilt u geen marketingberichten van Rinsly meer ontvangen?')
    expect(result.body).toContain('Ja, meld mij af')
    expect(result.body).toContain('name="token"')
    expect(result.body).toContain('noindex, nofollow')
    expect(result.body).not.toContain('person@example.com')
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

  it('POST one-click records the hash once, and a second POST stays success', async () => {
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
    expect(first.body).toContain('U bent afgemeld voor marketingberichten van Rinsly.')
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

describe('static export and redirects', () => {
  it('stashes the afmelden route out of the static export', () => {
    const src = readFileSync('scripts/build-static.mjs', 'utf8')
    expect(src).toContain("'src/app/(frontend)/[locale]/afmelden'")
  })

  it('redirects bare /afmelden to the default locale, without making it permanent', () => {
    const lines = staticRedirectLines('nl', ['nl', 'en'])
    expect(lines).toContain('/afmelden    /nl/afmelden    302')
    const nextCfg = readFileSync('next.config.ts', 'utf8')
    expect(nextCfg).toContain("{ source: '/afmelden', destination: '/nl/afmelden', permanent: false }")
  })
})
