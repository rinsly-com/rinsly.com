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

/**
 * Shown beside the quote submit button, and again when the server rejects the
 * quote, while KvK collection is off.
 */
export const B2B_QUOTE_REQUIRED = {
  nl: 'Rinsly contracteert alleen met zakelijke opdrachtgevers. Vink de verklaring aan. Zonder die verklaring sturen we geen offerte.',
  en: 'Rinsly only contracts with business clients. Tick the declaration. We cannot send a quote without it.',
} as const

/**
 * Same notice when KvK collection is on. Lawyer's earlier line, with the
 * 8-digit wording replaced by the registration-number phrase.
 */
export const B2B_QUOTE_REQUIRED_WITH_KVK = {
  nl: 'Rinsly contracteert alleen met zakelijke opdrachtgevers. Vink de verklaring aan en vul een geldig KvK-nummer of buitenlands registratienummer in. Zonder die gegevens sturen we geen offerte.',
  en: 'Rinsly only contracts with business clients. Tick the declaration and enter a valid Chamber of Commerce (KvK) or foreign registration number. We cannot send a quote without that.',
} as const

export const KVK_FIELD_LABEL = {
  nl: 'KvK-nummer of buitenlands registratienummer',
  en: 'Chamber of Commerce (KvK) or foreign registration number',
} as const

export type B2bLocale = keyof typeof B2B_CONFIRMATION_TEXT

export function b2bQuoteRequiredText(locale: B2bLocale, collectKvk: boolean): string {
  return collectKvk ? B2B_QUOTE_REQUIRED_WITH_KVK[locale] : B2B_QUOTE_REQUIRED[locale]
}

/** Raw registration-number cap, before separators or control characters are removed. */
export const KVK_RAW_MAX = 20

export type StoredB2bConfirmation = {
  b2bConfirmed: true
  /** Server clock, ISO-8601. Never a client-supplied time. */
  b2bConfirmedAt: string
  /** Dutch KvK: 8 digits after spaces, dots, and hyphens are stripped. Or a normalised foreign registration number. Omitted when collection is off. */
  kvkNummer?: string
}

/**
 * C0 (U+0000–001F), DEL and the rest of C1 (U+007F–009F), plus U+2028/2029.
 * Broader than the mail-field strip, which leaves most C1 intact.
 */
const REGISTRATION_CONTROLS = /[\u0000-\u001F\u007F-\u009F\u2028\u2029]/gu

/**
 * A Dutch KvK (exactly 8 digits after spaces, dots, and hyphens are stripped)
 * or a foreign business registration number: trimmed, 4–20 characters of
 * ASCII letters, digits, and space . - / only, with at least one letter and
 * one digit. Separators may not lead, trail, or repeat. A digits-only value
 * after that Dutch normalisation must be exactly 8 digits; it is never
 * accepted as foreign. Unicode dashes, digits, and NBSP are rejected. All
 * C0 and C1 control characters, plus U+2028/2029, are stripped after the
 * raw length cap. Only strings are accepted.
 */
export function normalizeKvk(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (value.length > KVK_RAW_MAX) return null
  const cleaned = value.replace(REGISTRATION_CONTROLS, '')

  const dutch = cleaned.replace(/[-. ]/g, '')
  if (/^[0-9]+$/.test(dutch)) {
    return dutch.length === 8 ? dutch : null
  }

  const foreign = cleaned.trim()
  if (foreign.length < 4 || foreign.length > KVK_RAW_MAX) return null
  if (!/^[A-Za-z0-9]+(?:[ .\-\/][A-Za-z0-9]+)*$/.test(foreign)) return null
  if (!/[A-Za-z]/.test(foreign) || !/[0-9]/.test(foreign)) return null
  return foreign
}

/**
 * A quote may be stored only when `b2bConfirmed` is boolean `true`. When
 * `collectKvk` is on, the registration number must also normalize. `"true"`,
 * `1`, and other truthy values are rejected. `b2bConfirmedAt` on the body is
 * ignored. Submitted registration numbers are ignored when collection is off.
 */
export function b2bFromSubmission(
  body: Record<string, unknown>,
  now: Date = new Date(),
  options: { collectKvk?: boolean } = {},
): StoredB2bConfirmation | null {
  if (body.b2bConfirmed !== true) return null
  if (!options.collectKvk) {
    return {
      b2bConfirmed: true,
      b2bConfirmedAt: now.toISOString(),
    }
  }
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
      label: { en: KVK_FIELD_LABEL.en, nl: KVK_FIELD_LABEL.nl },
      type: 'text',
      admin: { readOnly: true },
      access: b2bAccess(),
    },
  ]
}
