import type { CollectionConfig } from 'payload'

import { authenticated } from '@rinsly-com/site-core/access'

/**
 * Partner-aanvragen — studios recruited by Rinsly Lens configuring themselves.
 *
 * A candidate gets a signed invite link (rinsly.com/partner?token=…) and fills
 * in their own profile and, crucially, the responsibilities they are willing to
 * take on. Those responsibilities set their commission rate, so a row here is an
 * **application, not an agreed deal**: nothing is owed until Rinsly reviews it in
 * Ledger and draws up a contract.
 *
 * Rows are created only via the public `/api/partner-aanvraag` endpoint
 * (overrideAccess); direct API creation is closed. Ledger pulls them read-only —
 * it never writes here, the same one-writer rule the rest of the stack follows.
 */
export const PartnerAanvragen: CollectionConfig = {
  slug: 'partner-aanvragen',
  labels: {
    singular: { en: 'Partner application', nl: 'Partneraanvraag' },
    plural: { en: 'Partner applications', nl: 'Partneraanvragen' },
  },
  admin: {
    useAsTitle: 'bedrijfsnaam',
    defaultColumns: ['bedrijfsnaam', 'domein', 'email', 'status', 'createdAt'],
  },
  access: {
    read: authenticated,
    create: () => false, // only via /api/partner-aanvraag (overrideAccess)
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    // ── who they are ──────────────────────────────────────────────────────
    {
      name: 'domein',
      label: { en: 'Domain', nl: 'Domein' },
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'From the signed invite token — the identifier Lens and Ledger share.' },
    },
    { name: 'bedrijfsnaam', label: { en: 'Company', nl: 'Bedrijfsnaam' }, type: 'text', required: true },
    { name: 'contactpersoon', label: { en: 'Contact', nl: 'Contactpersoon' }, type: 'text' },
    { name: 'email', label: 'E-mail', type: 'text', required: true },
    { name: 'telefoon', label: { en: 'Phone', nl: 'Telefoon' }, type: 'text' },
    { name: 'adres', label: { en: 'Address', nl: 'Adres' }, type: 'text' },
    { name: 'plaats', label: { en: 'City', nl: 'Plaats' }, type: 'text' },
    { name: 'kvk', label: 'KvK', type: 'text' },
    { name: 'btwNummer', label: { en: 'VAT number', nl: 'Btw-nummer' }, type: 'text' },

    // ── what they want to take on ─────────────────────────────────────────
    // These three set the rate. Stored as booleans rather than a computed
    // percentage on purpose: the percentages live in Ledger's tenantRate.ts and
    // the contract generator, and a third copy here would be one too many.
    {
      name: 'exclusiviteit',
      label: { en: 'Exclusivity (+10%)', nl: 'Exclusiviteit (+10%)' },
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'relatiebeheer',
      label: { en: 'Relation & first-line support (+5%)', nl: 'Relatiebeheer (+5%)' },
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'marketing',
      label: { en: 'Marketing (+5%)', nl: 'Marketing (+5%)' },
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'figmaSeat',
      label: { en: 'Has a Figma seat with Dev Mode', nl: 'Heeft Figma met Dev Mode' },
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Required of every partner, so a "no" is a conversation, not a rejection.' },
    },

    // ── how they should be matched ────────────────────────────────────────
    {
      name: 'branches',
      label: { en: 'Branches', nl: 'Branches' },
      type: 'text',
      admin: { description: 'Comma-separated, e.g. kapper,restaurant. Empty means any branch.' },
    },
    {
      name: 'talen',
      label: { en: 'Languages', nl: 'Talen' },
      type: 'text',
      admin: { description: 'ISO 639-1, comma-separated, e.g. nl,de.' },
    },
    {
      name: 'landen',
      label: { en: 'Countries', nl: 'Landen' },
      type: 'text',
      admin: { description: 'ISO 3166-1 alpha-2, comma-separated, e.g. nl,be.' },
    },
    {
      name: 'opmerking',
      label: { en: 'Anything else', nl: 'Opmerking' },
      type: 'textarea',
    },

    // ── the funnel ────────────────────────────────────────────────────────
    {
      name: 'status',
      label: { en: 'Status', nl: 'Status' },
      type: 'select',
      defaultValue: 'new',
      index: true,
      options: [
        { label: { en: 'New', nl: 'Nieuw' }, value: 'new' },
        { label: { en: 'Imported into Ledger', nl: 'Geïmporteerd in Ledger' }, value: 'imported' },
        { label: { en: 'Declined', nl: 'Afgewezen' }, value: 'declined' },
      ],
      admin: {
        description:
          'Set to "imported" by Ledger once the application has been turned into a tenant, so it stops appearing in the review queue.',
      },
    },
  ],
  timestamps: true,
}
