import { cache } from 'react'
import { z } from 'zod'

import { getBindings } from './bindings'
import { logCaught } from './logCaught'
import { DEMO_TOKEN, demoEnabled, demoScorecard } from './leadlensDemo'

/**
 * LeadLens → website datacontract (v1). LeadLens publishes one folder per lead
 * in the `leadlens-checks` R2 bucket:
 *
 *   <token>/scorecard.json   — the shape parsed below
 *   <token>/desktop.png      — 1440px wide, full-page screenshot
 *   <token>/mobile.png       — 390px wide, above the fold
 *
 * Grades are school-report style (0–100, higher = better) and findings/pitch
 * arrive ready-made in Dutch — render as-is, never rewrite. Changes to this
 * contract must be coordinated with LeadLens (yaron@rinsly.com).
 */

export const GRADE_LABELS = {
  moderniteit: 'Moderniteit',
  snelheid: 'Snelheid',
  mobiel: 'Mobiel',
  vindbaarheid: 'Vindbaarheid',
  veiligheid: 'Veiligheid',
} as const

export type GradeKey = keyof typeof GRADE_LABELS

/** Insertion order of GRADE_LABELS. Hoisted so parse and render share one array. */
export const GRADE_KEYS = Object.keys(GRADE_LABELS) as GradeKey[]

export type Scorecard = {
  version: number
  token: string
  domain: string
  businessName: string
  niche?: string | undefined
  city?: string | undefined
  grades: Record<GradeKey, number>
  findings: string[]
  pitch?: string | undefined
  createdAt?: string | undefined
  expiresAt?: string | undefined
}

export type ScorecardResult =
  | { status: 'ok'; scorecard: Scorecard; screenshots: { desktop: boolean; mobile: boolean } }
  | { status: 'expired' }
  | { status: 'not_found' }

/** ≥128-bit random tokens, URL-safe alphabet, no separators (see handoff §4). */
export const TOKEN_RE = /^[A-Za-z0-9_-]{16,128}$/

/** Same thresholds as the scorecard e-mail's pills: green ≥65, blue 40–64, grey <40. */
export function gradeTone(score: number): 'good' | 'mid' | 'low' {
  return score >= 65 ? 'good' : score >= 40 ? 'mid' : 'low'
}

export function isExpired(scorecard: Pick<Scorecard, 'expiresAt'>, now = Date.now()): boolean {
  if (!scorecard.expiresAt) return false
  const t = Date.parse(scorecard.expiresAt)
  return Number.isFinite(t) && t < now
}

const scorecardInput = z.object({
  version: z.unknown().optional(),
  token: z.unknown().optional(),
  domain: z.unknown().optional(),
  businessName: z.unknown().optional(),
  niche: z.unknown().optional(),
  city: z.unknown().optional(),
  grades: z.unknown().optional(),
  findings: z.unknown().optional(),
  pitch: z.unknown().optional(),
  createdAt: z.unknown().optional(),
  expiresAt: z.unknown().optional(),
})

const gradeMap = z.record(z.string(), z.unknown())

/** Validate the raw JSON against the contract; null for anything malformed. */
export function parseScorecard(raw: unknown): Scorecard | null {
  const parsed = scorecardInput.safeParse(raw)
  if (!parsed.success) return null
  const data = parsed.data

  if (typeof data.domain !== 'string' || !data.domain.trim()) return null
  if (typeof data.businessName !== 'string' || !data.businessName.trim()) return null

  const grades = gradeMap.safeParse(data.grades)
  if (!grades.success) return null
  const parsedGrades = {} as Record<GradeKey, number>
  for (const key of GRADE_KEYS) {
    const value = grades.data[key]
    if (typeof value !== 'number' || !Number.isFinite(value)) return null
    parsedGrades[key] = Math.max(0, Math.min(100, Math.round(value)))
  }

  const findings = Array.isArray(data.findings)
    ? data.findings.filter((f): f is string => typeof f === 'string' && f.trim() !== '').slice(0, 5)
    : []

  const optional = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v : undefined)

  return {
    version: typeof data.version === 'number' ? data.version : 1,
    token: typeof data.token === 'string' ? data.token : '',
    domain: data.domain.trim(),
    businessName: data.businessName.trim(),
    niche: optional(data.niche),
    city: optional(data.city),
    grades: parsedGrades,
    findings,
    pitch: optional(data.pitch),
    createdAt: optional(data.createdAt),
    expiresAt: optional(data.expiresAt),
  }
}

/**
 * Load a lead's scorecard from R2. Deduped per request via React cache() —
 * generateMetadata and the page component share one R2 round-trip.
 */
export const getScorecard = cache(async (token: string): Promise<ScorecardResult> => {
  // /check/demo — design preview with fixture data, `next dev` only. In
  // production it falls through to the unknown-token path (regex mismatch).
  if (token === DEMO_TOKEN && demoEnabled()) return demoScorecard()
  if (!TOKEN_RE.test(token)) return { status: 'not_found' }

  const env = await getBindings()
  const object = await env.LEADLENS_CHECKS.get(`${token}/scorecard.json`)
  if (!object) return { status: 'not_found' }

  let scorecard: Scorecard | null = null
  try {
    scorecard = parseScorecard(await object.json())
  } catch (err) {
    logCaught('[leadlens] scorecard.json was not JSON', err)
    scorecard = null
  }
  if (!scorecard) return { status: 'not_found' }
  if (isExpired(scorecard)) return { status: 'expired' }

  const [desktop, mobile] = await Promise.all([
    env.LEADLENS_CHECKS.head(`${token}/desktop.png`),
    env.LEADLENS_CHECKS.head(`${token}/mobile.png`),
  ])

  return {
    status: 'ok',
    scorecard,
    screenshots: { desktop: desktop !== null, mobile: mobile !== null },
  }
})
