import { describe, expect, it } from 'vitest'

import { verifyPartnerToken } from '@/lib/partnerToken'

/**
 * The other half of this token lives in Rinsly Lens
 * (apps/tenants/src/partnerToken.ts) and is written against node:crypto, while
 * this one uses Web Crypto because it runs in a Worker. Nothing at build time
 * connects them, so THE VECTOR BELOW IS THE CONTRACT: the exact string Lens
 * produces for this secret and payload.
 *
 * If this fails, the two implementations have drifted. Fix the encoding, do not
 * update the expected string on one side only — Lens asserts the same vector.
 */
const VECTOR = {
  secret: 'test-secret-do-not-use-in-production',
  token:
    'eyJkIjoic3R1ZGlvLXZvb3JiZWVsZC5ubCIsIm4iOiJTdHVkaW8gVm9vcmJlZWxkIiwiYyI6IlV0cmVjaHQiLCJsIjoibmwiLCJleHAiOjE4MDAwMDAwMDB9.lJNcOCdRunym7BoZL0vaqxqKz0ZqMOlyv7FcZdBPOo4',
  payload: {
    d: 'studio-voorbeeld.nl',
    n: 'Studio Voorbeeld',
    c: 'Utrecht',
    l: 'nl',
    exp: 1_800_000_000,
  },
}

const BEFORE_EXPIRY = new Date(1_700_000_000_000)
const AFTER_EXPIRY = new Date(1_900_000_000_000)

describe('partner token', () => {
  it('accepts the token Lens mints, and decodes the same payload', async () => {
    const result = await verifyPartnerToken(VECTOR.token, VECTOR.secret, BEFORE_EXPIRY)
    expect(result.ok).toBe(true)
    expect(result.ok && result.payload).toEqual(VECTOR.payload)
  })

  it('rejects a token signed with a different secret', async () => {
    const result = await verifyPartnerToken(VECTOR.token, 'wrong-secret', BEFORE_EXPIRY)
    expect(result).toEqual({ ok: false, reason: 'bad_signature' })
  })

  it('rejects a tampered payload, even one that is valid base64', async () => {
    const [, signature] = VECTOR.token.split('.')
    const forged = btoa(JSON.stringify({ ...VECTOR.payload, d: 'concurrent.nl' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    const result = await verifyPartnerToken(`${forged}.${signature}`, VECTOR.secret, BEFORE_EXPIRY)
    expect(result).toEqual({ ok: false, reason: 'bad_signature' })
  })

  it('rejects an expired token whose signature is perfectly good', async () => {
    const result = await verifyPartnerToken(VECTOR.token, VECTOR.secret, AFTER_EXPIRY)
    expect(result).toEqual({ ok: false, reason: 'expired' })
  })

  it('rejects garbage without throwing', async () => {
    for (const junk of ['', '.', 'nodot', 'a.', '.b', 'not base64!.nope']) {
      const result = await verifyPartnerToken(junk, VECTOR.secret, BEFORE_EXPIRY)
      expect(result.ok, `expected ${JSON.stringify(junk)} to be rejected`).toBe(false)
    }
  })

  it('refuses to verify when no secret is configured', async () => {
    const result = await verifyPartnerToken(VECTOR.token, '', BEFORE_EXPIRY)
    expect(result.ok).toBe(false)
  })
})
