import { consentNotice, type StoredEmailConsent } from './emailConsent'

/** Identity fields on the public check and quote forms. */
export const SHORT_TEXT_MAX = 200

/** Free-text fields (message, other-addition, website URL). */
export const FREE_TEXT_MAX = 4000

/**
 * C0 controls, DEL, NEL (U+0085), and the Unicode line/paragraph separators.
 * Stripping these keeps a value on one mail-header line.
 */
const CONTROL_CHARS = /[\u0000-\u001F\u007F\u0085\u2028\u2029]/gu

export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, '')
}

/** Subject for the internal offerte mail. Control characters never reach the header. */
export function offerteMailSubject(bedrijf: string): string {
  return `Nieuwe offerteaanvraag: ${stripControlChars(bedrijf)}`
}

/** Subject for the internal website-check mail. The URL is stripped the same way. */
export function checkMailSubject(url: string): string {
  return `Nieuwe websitecheck-aanvraag: ${stripControlChars(url)}`
}

export function exceedsMax(value: string, max: number): boolean {
  return value.length > max
}

/** True when a /check lead field is over its limit. URL is free-text sized; name and phone are short. */
export function checkAanvraagFieldsTooLong(input: {
  url: string
  naam: string
  telefoon: string
}): boolean {
  return (
    exceedsMax(input.url, FREE_TEXT_MAX) ||
    exceedsMax(input.naam, SHORT_TEXT_MAX) ||
    exceedsMax(input.telefoon, SHORT_TEXT_MAX)
  )
}

/** True when a quote-form field is over its limit. */
export function offerteFieldsTooLong(input: {
  bedrijf: string
  naam: string
  email: string
  bericht: string
  additionsOther: string
}): boolean {
  return (
    exceedsMax(input.bedrijf, SHORT_TEXT_MAX) ||
    exceedsMax(input.naam, SHORT_TEXT_MAX) ||
    exceedsMax(input.email, SHORT_TEXT_MAX) ||
    exceedsMax(input.bericht, FREE_TEXT_MAX) ||
    exceedsMax(input.additionsOther, FREE_TEXT_MAX)
  )
}

/**
 * Sales mail for a quote. The server consent block is the first lines, then a
 * separator, then the visitor's answers. Single-line fields lose CR/LF so a
 * name cannot invent another consent line.
 */
export function offerteNotificationText(input: {
  bedrijf: string
  naam: string
  email: string
  subscription: string
  bericht: string
  consent: StoredEmailConsent
  kvkNummer?: string
}): string {
  const visitor = [
    'Er is een nieuwe offerteaanvraag binnengekomen via de contactwizard.',
    '',
    `Bedrijf: ${stripControlChars(input.bedrijf)}`,
    `Naam: ${stripControlChars(input.naam)}`,
    `E-mail: ${stripControlChars(input.email)}`,
    ...(input.kvkNummer !== undefined ? [`KvK: ${stripControlChars(input.kvkNummer)}`] : []),
    `Abonnement: ${input.subscription}`,
    ...(input.bericht ? ['', 'Bericht:', input.bericht] : []),
    '',
    'De aanvraag staat ook in het admin-panel onder Offerteaanvragen.',
  ]
  return `${consentNotice(input.consent)}\n---\n${visitor.join('\n')}`
}

/** Sales mail for a website-check lead. Name and phone stay on one line each. */
export function checkNotificationText(input: { url: string; naam: string; telefoon: string }): string {
  return [
    'Er is een nieuwe aanvraag binnengekomen via rinsly.com/check.',
    '',
    `Website: ${stripControlChars(input.url)}`,
    `Naam: ${stripControlChars(input.naam)}`,
    `Telefoon: ${stripControlChars(input.telefoon)}`,
    '',
    'De aanvraag staat ook in het admin-panel onder Websitecheck-aanvragen.',
  ].join('\n')
}

/** Subject for the internal partner-application mail. Control characters never reach the header. */
export function partnerMailSubject(bedrijfsnaam: string): string {
  return `Partneraanvraag: ${stripControlChars(bedrijfsnaam)}`
}

/** Free text keeps its line breaks (CR/LF → LF); every other control character goes. */
function stripControlCharsKeepLines(value: string): string {
  return value
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map(stripControlChars)
    .join('\n')
}

/**
 * Internal mail for a /partner application. Every value the applicant (or
 * the invite token) supplies is stripped of control characters; single-line
 * fields stay on one line so they cannot invent another line in the mail.
 */
export function partnerNotificationText(input: {
  bedrijfsnaam: string
  domein: string
  contactpersoon: string
  email: string
  telefoon: string
  plaats: string
  kvk: string
  chosen: string
  branches: string
  talen: string
  landen: string
  opmerking: string
}): string {
  const one = (value: string, empty = ',') => stripControlChars(value) || empty
  const opmerking = stripControlCharsKeepLines(input.opmerking)
  return (
    `${one(input.bedrijfsnaam)} (${one(input.domein)}) heeft het partnerformulier ingevuld.\n\n` +
    `Contact:      ${one(input.contactpersoon)}\n` +
    `E-mail:       ${one(input.email)}\n` +
    `Telefoon:     ${one(input.telefoon)}\n` +
    `Plaats:       ${one(input.plaats)}\n` +
    `KvK:          ${one(input.kvk)}\n\n` +
    `Wil oppakken: ${input.chosen}\n` +
    `Branches:     ${one(input.branches, 'alle')}\n` +
    `Talen:        ${one(input.talen)}\n` +
    `Landen:       ${one(input.landen)}\n\n` +
    (opmerking ? `Opmerking:\n${opmerking}\n\n` : '') +
    "Haal 'm binnen met `ledger partners --pull` en bekijk 'm onder [8] Tenants.\n" +
    'Let op: dit is een aanvraag, geen afspraak: het tarief staat pas vast als jij het contract maakt.'
  )
}
