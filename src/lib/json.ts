import type { PayloadRequest } from 'payload'
import { z } from 'zod'

import { logCaught } from './logCaught'

/** Coerce a JSON value the way the public forms always did, without stringifying objects. */
export function asText(value: unknown, max?: number): string {
  const raw =
    typeof value === 'string'
      ? value
      : typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint'
        ? String(value)
        : ''
  const trimmed = raw.trim()
  return max === undefined ? trimmed : trimmed.slice(0, max)
}

export async function readRequestJson(
  req: PayloadRequest,
): Promise<{ ok: true; value: unknown } | { ok: false }> {
  if (typeof req.json !== 'function') return { ok: true, value: {} }
  try {
    return { ok: true, value: await req.json() }
  } catch (err) {
    logCaught('[request] body was not JSON', err)
    return { ok: false }
  }
}

/** JSON object, or null when the value is not a plain object. */
export function asJsonObject(value: unknown): Record<string, unknown> | null {
  const parsed = z.looseObject({}).safeParse(value)
  if (!parsed.success) return null
  return parsed.data
}

export async function readJsonResponse(res: Response, context: string): Promise<unknown> {
  try {
    return await res.json()
  } catch (err) {
    logCaught(context, err)
    return {}
  }
}

export const formAckSchema = z.object({
  ok: z.boolean().optional(),
  error: z.string().optional(),
})

export const checkStartSchema = formAckSchema.extend({
  token: z.string().optional(),
})

export const checkPollSchema = z.object({
  ok: z.boolean().optional(),
  status: z
    .object({
      state: z.string(),
      step: z.string(),
    })
    .optional(),
})

export const deployResponseSchema = z.object({
  status: z.enum(['triggered', 'skipped', 'failed']),
  message: z.string(),
  httpStatus: z.number().optional(),
})

export const partnerVerifySchema = z.object({
  ok: z.boolean(),
  reason: z.string().optional(),
  prefill: z
    .object({
      domein: z.string(),
      bedrijfsnaam: z.string(),
      plaats: z.string(),
      land: z.string(),
    })
    .optional(),
})
