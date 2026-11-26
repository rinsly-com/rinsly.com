import type { CheckboxField, DateField, FieldAccess, TextField } from 'payload'

import { adminFieldOnly } from '@rinsly-com/site-core/access'

/**
 * Exact checkbox label. The English sentence still needs Marketeer/Lawyer OK.
 * Dutch is the wording from Yaron's decision (26 Nov 2026).
 */
export const B2B_CONFIRMATION_TEXT = {
  nl: 'Ik handel in de uitoefening van een beroep of bedrijf. Rinsly contracteert alleen met zakelijke opdrachtgevers.',
  en: 'I am acting in the course of a trade or business. Rinsly only contracts with business clients.',
} as const

export type B2bLocale = keyof typeof B2B_CONFIRMATION_TEXT

/** Raw KvK input cap, before spaces and dots are removed. Eight digits with separators fit. */
export const KVK_RAW_MAX = 20

export type StoredB2bConfirmation = {
  b2bConfirmed: true
  /** Server clock, ISO-8601. Never a client-supplied time. */
  b2bConfirmedAt: string
  /** Eight digits, spaces and dots removed. */
  kvkNummer: string
}

/**
 * Eight digits after spaces and dots are removed. Anything else, including a
 * raw value longer than {@link KVK_RAW_MAX}, is rejected. Only strings are
 * accepted.
 */
export function normalizeKvk(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (value.length > KVK_RAW_MAX) return null
  const digits = value.replace(/[ .]/g, '')
  if (!/^\d{8}$/.test(digits)) return null
  return digits
}

/**
 * A quote may be stored only when `b2bConfirmed` is boolean `true` and the KvK
 * number normalizes. `"true"`, `1`, and other truthy values are rejected.
 * `b2bConfirmedAt` on the body is ignored.
 */
export function b2bFromSubmission(
  body: Record<string, unknown>,
  now: Date = new Date(),
): StoredB2bConfirmation | null {
  if (body.b2bConfirmed !== true) return null
  const kvkNummer = normalizeKvk(body.kvkNummer)
  if (kvkNummer === null) return null
  return {
    b2bConfirmed: true,
    b2bConfirmedAt: now.toISOString(),
    kvkNummer,
  }
}

function b2bAccess(): { read: FieldAccess; update: FieldAccess } {
  return {
    read: adminFieldOnly,
    update: () => false,
  }
}

/** Admin-read-only, same rule as the email-consent columns. Nullable in D1. */
export function b2bConfirmationFields(): [CheckboxField, DateField, TextField] {
  return [
    {
      name: 'b2bConfirmed',
      label: { en: 'Business confirmation', nl: 'Zakelijke bevestiging' },
      type: 'checkbox',
      admin: { readOnly: true },
      access: b2bAccess(),
    },
    {
      name: 'b2bConfirmedAt',
      label: { en: 'Business confirmation at', nl: 'Zakelijk bevestigd op' },
      type: 'date',
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
      access: b2bAccess(),
    },
    {
      name: 'kvkNummer',
      label: { en: 'KvK number', nl: 'KvK-nummer' },
      type: 'text',
      admin: { readOnly: true },
      access: b2bAccess(),
    },
  ]
}
