/** Identity fields on the public check and quote forms. */
export const SHORT_TEXT_MAX = 200

/** Free-text fields (message, other-addition, website URL). */
export const FREE_TEXT_MAX = 4000

/**
 * C0 controls, DEL, and the Unicode line/paragraph separators. Stripping these
 * keeps a value on one mail-header line.
 */
const CONTROL_CHARS = /[\u0000-\u001F\u007F\u2028\u2029]/gu

export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, '')
}

/** Subject for the internal offerte mail. Control characters never reach the header. */
export function offerteMailSubject(bedrijf: string): string {
  return `Nieuwe offerteaanvraag: ${stripControlChars(bedrijf)}`
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
