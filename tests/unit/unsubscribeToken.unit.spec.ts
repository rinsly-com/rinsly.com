import { describe, expect, it } from 'vitest'

import {
  buildUnsubscribeUrl,
  emailHash,
  mintUnsubscribeToken,
  normalizeEmail,
  UNSUBSCRIBE_MAC_LENGTH,
  verifyUnsubscribeToken,
} from '../../src/lib/unsubscribeToken'

/**
 * Shared contract with a later Python mint in the mail script. If this
 * fails, the encodings have drifted. Fix the algorithm; do not update the
 * expected string on one side only.
 */
const VECTOR = {
  secret: 'test-secret-do-not-use-in-production',
  email: 'person@example.com',
  token:
    'v1.Ov1dVkRaLQ8uiXkYwiYIIoAwmbtZJ-_41d3vKIFFnhk.iC9WvieAXU-8K-M0Nih7VL0-99IxbE0iuBryptDIc28',
}

describe('normalizeEmail', () => {
  it('trims and lowercases a valid address', () => {
    expect(normalizeEmail('  Person@Example.COM  ')).toBe('person@example.com')
  })

  it('rejects values that are not a single address', () => {
    for (const raw of ['', 'no-at', '@example.com', 'person@', 'a@b@c.com', 'person @example.com']) {
      expect(normalizeEmail(raw)).toBeNull()
    }
  })
})

describe('unsubscribe token', () => {
  it('mints the pinned vector and verifies it', async () => {
    const token = await mintUnsubscribeToken(VECTOR.email, VECTOR.secret)
    expect(token).toBe(VECTOR.token)
    const result = await verifyUnsubscribeToken(VECTOR.token, VECTOR.secret)
    expect(result).toEqual({
      ok: true,
      emailHash: 'Ov1dVkRaLQ8uiXkYwiYIIoAwmbtZJ-_41d3vKIFFnhk',
      version: 1,
    })
  })

  it('normalizes the address before hashing, so case and spaces do not change the token', async () => {
    const token = await mintUnsubscribeToken('  Person@Example.COM  ', VECTOR.secret)
    expect(token).toBe(VECTOR.token)
  })

  it('does not put the email, even encoded, in the token', async () => {
    const token = await mintUnsubscribeToken(VECTOR.email, VECTOR.secret)
    expect(token.toLowerCase()).not.toContain('person')
    expect(token.toLowerCase()).not.toContain('example')
    expect(token).not.toContain(btoa(VECTOR.email).replace(/=+$/, ''))
  })

  it('rejects a wrong secret, a tampered hash, or a truncated token as invalid', async () => {
    expect(await verifyUnsubscribeToken(VECTOR.token, 'wrong-secret')).toEqual({
      ok: false,
      reason: 'invalid',
    })
    const hash = 'Ov1dVkRaLQ8uiXkYwiYIIoAwmbtZJ-_41d3vKIFFnhk'
    const signature = 'iC9WvieAXU-8K-M0Nih7VL0-99IxbE0iuBryptDIc28'
    expect(hash).toHaveLength(UNSUBSCRIBE_MAC_LENGTH)
    expect(signature).toHaveLength(UNSUBSCRIBE_MAC_LENGTH)
    const tampered = `v1.${hash.slice(0, -1)}A.${signature}`
    expect(await verifyUnsubscribeToken(tampered, VECTOR.secret)).toEqual({
      ok: false,
      reason: 'invalid',
    })
    expect(await verifyUnsubscribeToken('v1.onlytwo', VECTOR.secret)).toEqual({
      ok: false,
      reason: 'invalid',
    })
  })

  it('rejects a bad charset, the wrong length, an extra segment, or an empty part as invalid', async () => {
    const hash = 'Ov1dVkRaLQ8uiXkYwiYIIoAwmbtZJ-_41d3vKIFFnhk'
    const signature = 'iC9WvieAXU-8K-M0Nih7VL0-99IxbE0iuBryptDIc28'
    const malformed = {
      'bad charset': `v1.${hash.slice(0, -1)}+.${signature}`,
      'wrong length': `v1.${hash.slice(0, -1)}.${signature}`,
      'extra segment': `v1.${hash}.${signature}.extra`,
      'empty part': `v1..${signature}`,
    }
    for (const [label, token] of Object.entries(malformed)) {
      expect(await verifyUnsubscribeToken(token, VECTOR.secret), label).toEqual({
        ok: false,
        reason: 'invalid',
      })
    }
  })

  it('fails closed when the secret is missing', async () => {
    expect(await verifyUnsubscribeToken(VECTOR.token, '')).toEqual({
      ok: false,
      reason: 'missing_secret',
    })
    await expect(mintUnsubscribeToken(VECTOR.email, '')).rejects.toThrow('unsubscribe secret is missing')
  })

  it('hashes the same email to the hash inside the vector', async () => {
    await expect(emailHash('person@example.com', VECTOR.secret)).resolves.toBe(
      'Ov1dVkRaLQ8uiXkYwiYIIoAwmbtZJ-_41d3vKIFFnhk',
    )
  })

  it('builds a locale path with the token as a query param', () => {
    expect(buildUnsubscribeUrl('https://www.rinsly.com/', 'nl', VECTOR.token)).toBe(
      `https://www.rinsly.com/nl/afmelden?token=${encodeURIComponent(VECTOR.token)}`,
    )
  })
})
