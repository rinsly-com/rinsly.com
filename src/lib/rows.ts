import { z } from 'zod'

/** Numeric primary key Payload returns for our D1 collections. */
export const idRowSchema = z.object({ id: z.number() }).loose()

/** Payload user row fields this app reads back from D1. */
export const userRowSchema = z
  .object({
    id: z.number(),
    email: z.string(),
    roles: z.array(z.enum(['admin', 'editor'])),
  })
  .loose()

const nullableText = z.string().nullable().optional()
const nullableBool = z.boolean().nullable().optional()

/**
 * Partner-aanvraag row as D1/Payload actually returns it. Optional text and
 * checkbox columns are nullable; a row that still doesn't match is skipped
 * by the pending handler instead of failing the whole pull.
 */
export const partnerRowSchema = z
  .object({
    id: z.number(),
    domein: z.string(),
    bedrijfsnaam: z.string(),
    email: z.string(),
    contactpersoon: nullableText,
    telefoon: nullableText,
    adres: nullableText,
    plaats: nullableText,
    kvk: nullableText,
    btwNummer: nullableText,
    exclusiviteit: nullableBool,
    relatiebeheer: nullableBool,
    marketing: nullableBool,
    branches: nullableText,
    talen: nullableText,
    landen: nullableText,
    opmerking: nullableText,
    status: z.enum(['new', 'imported', 'declined']).nullable().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  })
  .loose()
