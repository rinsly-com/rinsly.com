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

/** Partner-aanvraag row fields Ledger and the resubmit path read back. */
export const partnerRowSchema = z
  .object({
    id: z.number(),
    domein: z.string(),
    bedrijfsnaam: z.string(),
    email: z.string(),
    status: z.enum(['new', 'imported', 'declined']).nullable().optional(),
  })
  .loose()
