import type { CheckboxField, DateField, FieldAccess, TextField } from 'payload'

/**
 * Exact checkbox label, per locale. The public forms render these strings and
 * the server stores the same constant. Do not accept a consent sentence from
 * the client.
 *
 * The English sentence still needs Marketeer/Legal OK. Dutch is the approved
 * label from the board item (26 Nov 2026).
 */
export const EMAIL_CONSENT_TEXT = {
  nl: 'Ja, Rinsly mag mij hierover e-mailen',
  en: 'Yes, Rinsly may email me about this',
} as const

export type EmailConsentLocale = keyof typeof EMAIL_CONSENT_TEXT

export type StoredEmailConsent = {
  consentGiven: boolean
  /** Server clock, ISO-8601, or null when the box was not ticked. */
  consentAt: string | null
  /** {@link EMAIL_CONSENT_TEXT} for the locale shown, or null when not ticked. */
  consentText: string | null
}

/**
 * Consent columns for `check-aanvragen` and `offertes`.
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
 * Admins may read the consent record. Editors do not. The columns stay
 * read-only: update is closed, and the admin control is read-only.
 * `authenticated` from site-core is true for every signed-in user, including
 * editors, so it cannot hide these fields.
 */
export function userCanReadConsent(user: unknown): boolean {
  if (typeof user !== 'object' || user === null || !('roles' in user)) return false
  const { roles } = user
  if (!Array.isArray(roles)) return false
  for (const role of roles) {
    if (role === 'admin') return true
  }
  return false
}

function consentAccess(): { read: FieldAccess; update: FieldAccess } {
  return {
    read: ({ req: { user } }) => userCanReadConsent(user),
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
