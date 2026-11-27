/**
 * User-facing copy for /{locale}/afmelden.
 *
 * Approved by Lawyer + Marketeer on 27 Nov 2026, 23:36 (Europe/Amsterdam),
 * with the je-form, success follow-up, and home link applied here.
 */
import type { UnsubscribeLocale } from './unsubscribeToken'

export const UNSUBSCRIBE_COPY_STATUS = 'approved-lawyer-marketeer' as const

export const UNSUBSCRIBE_COPY = {
  nl: {
    title: 'Afmelden',
    confirm: 'Wil je geen marketingberichten van Rinsly meer ontvangen?',
    button: 'Ja, meld mij af',
    cancel: 'Annuleren',
    success: 'Je bent afgemeld voor marketingberichten van Rinsly.',
    successFollowUpBefore:
      'Je ontvangt alleen nog berichten die nodig zijn voor een lopende opdracht, zoals facturen. Meer informatie: ',
    successFollowUpLink: 'rinsly.com/nl/privacy',
    successFollowUpHref: '/nl/privacy',
    successFollowUpAfter: ' (sectie 8).',
    homeLink: 'Terug naar rinsly.com',
    invalid:
      'Deze link is niet geldig. Je kunt je ook afmelden via contact@rinsly.com.',
    unavailable:
      'Afmelden is nu niet mogelijk. Mail naar contact@rinsly.com. We lossen dit zo snel mogelijk op.',
  },
  en: {
    title: 'Unsubscribe',
    confirm: 'Do you want to stop receiving marketing messages from Rinsly?',
    button: 'Yes, unsubscribe me',
    cancel: 'Cancel',
    success: 'You have been unsubscribed from Rinsly marketing messages.',
    successFollowUpBefore:
      'You will only receive messages needed for an ongoing assignment, such as invoices. More information: ',
    successFollowUpLink: 'rinsly.com/en/privacy',
    successFollowUpHref: '/en/privacy',
    successFollowUpAfter: ' (section 8).',
    homeLink: 'Back to rinsly.com',
    invalid:
      'This link is not valid. You can also unsubscribe by emailing contact@rinsly.com.',
    unavailable:
      'Unsubscribe is not available just now. Email contact@rinsly.com and we will fix this as soon as we can.',
  },
} as const

/**
 * Not shown until DNC sync is automatic (Lawyer, 27 Nov 2026).
 * NL: 'We benaderen je ook niet meer via LinkedIn of telefoon.'
 * EN: 'We will also not contact you via LinkedIn or phone.'
 */
export const UNSUBSCRIBE_ALL_CHANNELS_LINE_PENDING = true

export type UnsubscribeCopy = (typeof UNSUBSCRIBE_COPY)[UnsubscribeLocale]

export function unsubscribeCopy(locale: UnsubscribeLocale): UnsubscribeCopy {
  return UNSUBSCRIBE_COPY[locale]
}
