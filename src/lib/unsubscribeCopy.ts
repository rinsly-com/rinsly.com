/**
 * User-facing copy for /{locale}/afmelden.
 *
 * COPY PENDING Lawyer / Marketeer confirmation. These sentences are a minimal
 * draft so the route can be built and reviewed; they are not approved site
 * copy. Do not treat them as final, and do not reuse them in the privacy
 * statement or in mail until Legal and Marketing have signed off.
 */
import type { UnsubscribeLocale } from './unsubscribeToken'

export const UNSUBSCRIBE_COPY_STATUS = 'pending-lawyer-marketeer' as const

export const UNSUBSCRIBE_COPY = {
  nl: {
    title: 'Afmelden',
    confirm: 'Wilt u geen marketingberichten van Rinsly meer ontvangen?',
    button: 'Ja, meld mij af',
    cancel: 'Annuleren',
    success: 'U bent afgemeld voor marketingberichten van Rinsly.',
    invalid:
      'Deze link is niet geldig. U kunt zich ook afmelden via contact@rinsly.com.',
    unavailable:
      'Afmelden is nu niet mogelijk. Mail naar contact@rinsly.com. We lossen dit zo snel mogelijk op.',
  },
  en: {
    title: 'Unsubscribe',
    confirm: 'Do you want to stop receiving marketing messages from Rinsly?',
    button: 'Yes, unsubscribe me',
    cancel: 'Cancel',
    success: 'You have been unsubscribed from Rinsly marketing messages.',
    invalid:
      'This link is not valid. You can also unsubscribe by emailing contact@rinsly.com.',
    unavailable:
      'Unsubscribe is not available just now. Email contact@rinsly.com and we will fix this as soon as we can.',
  },
} as const

export type UnsubscribeCopy = (typeof UNSUBSCRIBE_COPY)[UnsubscribeLocale]

export function unsubscribeCopy(locale: UnsubscribeLocale): UnsubscribeCopy {
  return UNSUBSCRIBE_COPY[locale]
}
