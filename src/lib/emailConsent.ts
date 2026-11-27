import type { CheckboxField, DateField, FieldAccess, TextField } from 'payload'

import { adminFieldOnly } from '@rinsly-com/site-core/access'

/**
 * Exact checkbox label, per locale. The public forms render these strings and
 * the server stores the same constant. Do not accept a consent sentence from
 * the client.
 *
 * The English sentences are the lawyer's wording from the 26 Nov 2026 review.
 */
export const EMAIL_CONSENT_TEXT = {
  nl: 'Ja, ik wil ook e-mails van Rinsly ontvangen over jullie diensten en het partnerprogramma. Dit is niet nodig om de offerte te ontvangen.',
  en: 'Yes, I would also like Rinsly to e-mail me about your services and partner programme. This is not needed to receive the quote.',
} as const

export type EmailConsentLocale = keyof typeof EMAIL_CONSENT_TEXT

/** Shown under the checkbox. Not stored. The link word is the privacy policy. */
export const EMAIL_CONSENT_WITHDRAWAL = {
  nl: {
    before:
      'U kunt deze toestemming te allen tijde intrekken via contact@rinsly.com of via de afmeldlink in de e-mail. Meer informatie staat in onze ',
    link: 'privacyverklaring',
    href: '/nl/privacy',
    after: '.',
  },
  en: {
    before:
      'You can withdraw this consent at any time by e-mailing contact@rinsly.com or using the unsubscribe link in the e-mail. More information is in our ',
    link: 'privacy policy',
    href: '/en/privacy',
    after: '.',
  },
} as const

/**
 * Version id for the exact sentences shown at the tick (label + helper).
 * Storing this on the offerte row needs a new `consent_version` column; that
 * migration is proposed in docs/marketing-unsubscribe.md and is not written
 * here (it needs Yaron's OK). Until then the constant is the changelog key
 * only. Do not invent new sentences under an old id.
 */
export const EMAIL_CONSENT_VERSION = '2026-11-26'

export const EMAIL_CONSENT_CHANGELOG = {
  '2026-11-26': {
    label: EMAIL_CONSENT_TEXT,
    withdrawal: EMAIL_CONSENT_WITHDRAWAL,
  },
} as const

export type StoredEmailConsent = {
  consentGiven: boolean
  /** Server clock, ISO-8601, or null when the box was not ticked. */
  consentAt: string | null
  /** {@link EMAIL_CONSENT_TEXT} for the locale shown, or null when not ticked. */
  consentText: string | null
}

/**
 * Consent columns for `offertes` only. The website-check form has no email
 * address, so it does not ask for or store this consent.
 *
 * Retention: keep `consentGiven`, `consentAt` and `consentText` for 5 years
 * after the last email sent about that submission, then a later cleanup job
 * may null them. This repo does not run that job. `consentAt` is the server
 * time of the tick, not the last-mail clock. Until outbound mail timestamps
 * exist, a cleanup can query `consentGiven = true` and `consentAt` as the
 * anchor and must not treat `consentAt + 5 years` as the deletion date by
 * itself.
 */
/**
 * Admins may read the consent record (`adminFieldOnly`). Editors do not.
 * Update stays closed, and the admin control is read-only.
 */
function consentAccess(): { read: FieldAccess; update: FieldAccess } {
  return {
    read: adminFieldOnly,
    update: () => false,
  }
}

export function emailConsentFields(): [CheckboxField, DateField, TextField] {
  return [
    {
      name: 'consentGiven',
      label: { en: 'Email consent', nl: 'E-mailtoestemming' },
      type: 'checkbox',
      defaultValue: false,
      admin: { readOnly: true },
      access: consentAccess(),
    },
    {
      name: 'consentAt',
      label: { en: 'Consent at', nl: 'Toestemming op' },
      type: 'date',
      index: true,
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
      },
      access: consentAccess(),
    },
    {
      name: 'consentText',
      label: { en: 'Consent text', nl: 'Toestemmingstekst' },
      type: 'text',
      admin: { readOnly: true },
      access: consentAccess(),
    },
  ]
}

/**
 * Build the three consent columns from a public form body.
 *
 * A tick is only boolean `true` on `emailConsent`. Anything else (missing,
 * false, the string `"true"`) stores `consentGiven: false` and nulls the
 * other two columns. The timestamp is `now` on the server, ISO-8601. The
 * text is {@link EMAIL_CONSENT_TEXT} for locale `en`, and the Dutch sentence
 * for every other locale. `consentAt`, `consentText` and `consentGiven` on
 * the body are never copied onto the row.
 */
export function emailConsentFromSubmission(
  body: Record<string, unknown>,
  now: Date = new Date(),
): StoredEmailConsent {
  if (body.emailConsent !== true) {
    return { consentGiven: false, consentAt: null, consentText: null }
  }
  const locale: EmailConsentLocale = body.locale === 'en' ? 'en' : 'nl'
  return {
    consentGiven: true,
    consentAt: now.toISOString(),
    consentText: EMAIL_CONSENT_TEXT[locale],
  }
}

/** One block for the internal sales mail. Not the legal record; the columns are. */
export function consentNotice(consent: StoredEmailConsent): string {
  if (!consent.consentGiven || consent.consentAt === null || consent.consentText === null) {
    return 'E-mailtoestemming: nee'
  }
  return `E-mailtoestemming: ja\nToestemmingstekst: ${consent.consentText}\nTijdstip: ${consent.consentAt}`
}
