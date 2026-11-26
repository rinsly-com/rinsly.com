import type { CheckboxField, DateField, FieldAccess, TextField } from 'payload'

import { adminFieldOnly } from '@rinsly-com/site-core/access'

/**
 * Exact checkbox label. Dutch is Yaron's wording (26 Nov 2026). English is the
 * lawyer's sentence from the same day.
 */
export const B2B_CONFIRMATION_TEXT = {
  nl: 'Ik handel in de uitoefening van een beroep of bedrijf. Rinsly contracteert alleen met zakelijke opdrachtgevers.',
  en: 'I am acting in the course of a business or profession. Rinsly only contracts with business clients.',
} as const

/** Shown beside the quote submit button, and again when the server rejects the quote. */
export const B2B_QUOTE_REQUIRED = {
  nl: 'Rinsly contracteert alleen met zakelijke opdrachtgevers. Vink de verklaring aan en vul een geldig KvK-nummer (8 cijfers) in. Zonder die gegevens sturen we geen offerte.',
  en: 'Rinsly only contracts with business clients. Tick the declaration and enter a valid Chamber of Commerce (KvK) number (8 digits). We cannot send a quote without that.',
} as const

export type B2bLocale = keyof typeof B2B_CONFIRMATION_TEXT

/** Raw KvK input cap, before spaces, dots, and hyphens are removed. Eight digits with separators fit. */
export const KVK_RAW_MAX = 20

export type StoredB2bConfirmation = {
  b2bConfirmed: true
  /** Server clock, ISO-8601. Never a client-supplied time. */
  b2bConfirmedAt: string
  /** Eight digits, spaces and dots removed. */
  kvkNummer: string
}

/**
 * Eight digits after spaces, dots, and hyphens are removed. Anything else,
 * including a raw value longer than {@link KVK_RAW_MAX} and a foreign
 * registration number, is rejected. Only strings are accepted.
 */
export function normalizeKvk(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (value.length > KVK_RAW_MAX) return null
  const digits = value.replace(/[-. ]/g, '')
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
