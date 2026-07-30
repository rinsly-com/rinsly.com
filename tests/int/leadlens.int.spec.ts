// @vitest-environment node
// Unit tests for the LeadLens datacontract layer behind /check/<token>
// (src/lib/leadlens.ts): JSON validation, expiry and the e-mail-matching
// grade-pill thresholds.
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TOKEN_RE, getScorecard, gradeTone, isExpired, parseScorecard } from '@/lib/leadlens'
import { DEMO_TOKEN, demoEnabled, demoScorecard } from '@/lib/leadlensDemo'

const valid = () => ({
  version: 1,
  token: 'kJ8mQ2xVfR4nWp7c',
  domain: 'kapsalonjan.nl',
  businessName: 'Kapsalon Jan',
  niche: 'kapper',
  city: 'Eindhoven',
  grades: { moderniteit: 50, snelheid: 83, mobiel: 10, vindbaarheid: 83, veiligheid: 15 },
  findings: ['copyrightjaar staat al 14 jaar vast op 2012'],
  pitch: 'De site draait nog op WordPress 3.4 uit 2012…',
  createdAt: '2026-07-29T09:00:00Z',
  expiresAt: '2026-10-27T09:00:00Z',
})

describe('parseScorecard', () => {
  it('accepts the datacontract example', () => {
    const sc = parseScorecard(valid())
    expect(sc).not.toBeNull()
    expect(sc!.domain).toBe('kapsalonjan.nl')
    expect(sc!.grades.snelheid).toBe(83)
    expect(sc!.findings).toHaveLength(1)
  })

  it('rejects non-objects and missing required fields', () => {
    expect(parseScorecard(null)).toBeNull()
    expect(parseScorecard('{}')).toBeNull()
    expect(parseScorecard({ ...valid(), domain: '' })).toBeNull()
    expect(parseScorecard({ ...valid(), businessName: undefined })).toBeNull()
  })

  it('rejects malformed grades and clamps out-of-range scores', () => {
    expect(parseScorecard({ ...valid(), grades: undefined })).toBeNull()
    expect(parseScorecard({ ...valid(), grades: { moderniteit: 50 } })).toBeNull()
    expect(
      parseScorecard({ ...valid(), grades: { ...valid().grades, mobiel: 'laag' } }),
    ).toBeNull()

    const clamped = parseScorecard({
      ...valid(),
      grades: { ...valid().grades, mobiel: -5, snelheid: 250 },
    })
    expect(clamped!.grades.mobiel).toBe(0)
    expect(clamped!.grades.snelheid).toBe(100)
  })

  it('caps findings at 5 and drops non-string entries', () => {
    const sc = parseScorecard({
      ...valid(),
      findings: ['a', 'b', 42, '', 'c', 'd', 'e', 'f'],
    })
    expect(sc!.findings).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('tolerates absent optional fields', () => {
    const { niche: _n, city: _c, pitch: _p, expiresAt: _e, ...minimal } = valid()
    const sc = parseScorecard(minimal)
    expect(sc).not.toBeNull()
    expect(sc!.niche).toBeUndefined()
    expect(sc!.expiresAt).toBeUndefined()
  })
})

describe('isExpired', () => {
  it('is false before expiresAt, true after, false when absent', () => {
    const sc = { expiresAt: '2026-10-27T09:00:00Z' }
    expect(isExpired(sc, Date.parse('2026-10-27T08:59:59Z'))).toBe(false)
    expect(isExpired(sc, Date.parse('2026-10-27T09:00:01Z'))).toBe(true)
    expect(isExpired({ expiresAt: undefined })).toBe(false)
    expect(isExpired({ expiresAt: 'geen datum' })).toBe(false)
  })
})

describe('gradeTone — the e-mail pill thresholds (green ≥65, blue 40–64, grey <40)', () => {
  it.each([
    [65, 'good'],
    [100, 'good'],
    [64, 'mid'],
    [40, 'mid'],
    [39, 'low'],
    [0, 'low'],
  ] as const)('%i → %s', (score, tone) => {
    expect(gradeTone(score)).toBe(tone)
  })
})

describe('demo lead (/check/demo, dev only)', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is gated to NODE_ENV=development', () => {
    expect(demoEnabled()).toBe(false) // vitest runs with NODE_ENV=test
    vi.stubEnv('NODE_ENV', 'development')
    expect(demoEnabled()).toBe(true)
    vi.stubEnv('NODE_ENV', 'production')
    expect(demoEnabled()).toBe(false)
  })

  it('getScorecard treats "demo" as unknown outside development (no R2 touched)', async () => {
    // DEMO_TOKEN fails TOKEN_RE, so this resolves before any binding lookup.
    await expect(getScorecard(DEMO_TOKEN)).resolves.toEqual({ status: 'not_found' })
  })

  it('the demo fixture satisfies the datacontract parser', () => {
    const demo = demoScorecard()
    expect(demo.status).toBe('ok')
    if (demo.status === 'ok') {
      expect(parseScorecard(demo.scorecard)).not.toBeNull()
      expect(isExpired(demo.scorecard)).toBe(false)
    }
  })
})

describe('TOKEN_RE', () => {
  it('accepts URL-safe tokens and rejects path tricks', () => {
    expect(TOKEN_RE.test('kJ8mQ2xVfR4nWp7c')).toBe(true)
    expect(TOKEN_RE.test('a'.repeat(128))).toBe(true)
    expect(TOKEN_RE.test('short')).toBe(false)
    expect(TOKEN_RE.test('../../etc/passwd')).toBe(false)
    expect(TOKEN_RE.test('abc def ghi jkl mno')).toBe(false)
    expect(TOKEN_RE.test('a'.repeat(129))).toBe(false)
  })
})
