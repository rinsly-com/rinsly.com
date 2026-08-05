import type { CollectionConfig } from 'payload'

import { authenticated } from '@rinsly-com/site-core/access'

/**
 * Offertes — quote requests submitted through the multi-step contact wizard.
 * Rows are created only via the public `/api/offerte` endpoint (overrideAccess);
 * direct API creation is closed. Readable/manageable by staff in the admin.
 */
export const Offertes: CollectionConfig = {
  slug: 'offertes',
  labels: {
    singular: { en: 'Quote request', nl: 'Offerteaanvraag' },
    plural: { en: 'Quote requests', nl: 'Offerteaanvragen' },
  },
  admin: {
    useAsTitle: 'bedrijf',
    defaultColumns: ['bedrijf', 'naam', 'email', 'subscription', 'createdAt'],
  },
  access: {
    read: authenticated,
    create: () => false, // only via the /api/offerte endpoint (overrideAccess)
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'bedrijf', label: { en: 'Company', nl: 'Bedrijf' }, type: 'text', required: true },
    { name: 'naam', label: { en: 'Contact person', nl: 'Contactpersoon' }, type: 'text', required: true },
    { name: 'email', label: { en: 'Email', nl: 'E-mail' }, type: 'email', required: true },
    {
      name: 'subscription',
      label: { en: 'Subscription', nl: 'Abonnement' },
      type: 'select',
      options: [
        { label: { en: 'Care', nl: 'Care' }, value: 'care' },
        { label: { en: 'Managed', nl: 'Managed' }, value: 'beheerd' },
        // Label only — the stored value stays `partner` until the enum migration
        // (see FACILITATOR-MIGRATION.md). "Partner" now means a design studio.
        { label: { en: 'Growth', nl: 'Growth' }, value: 'partner' },
        { label: { en: 'Custom', nl: 'Op maat' }, value: 'opmaat' },
      ],
    },
    {
      name: 'additions',
      label: { en: 'Additions', nl: 'Toevoegingen' },
      type: 'select',
      hasMany: true,
      options: [
        { label: { en: 'Localization', nl: 'Meertaligheid' }, value: 'localization' },
        { label: { en: 'Email on your domain', nl: 'E-mail op eigen domein' }, value: 'email' },
        { label: { en: 'Design & branding', nl: 'Vormgeving & huisstijl' }, value: 'design' },
        { label: { en: 'SEO', nl: 'SEO & vindbaarheid' }, value: 'seo' },
        { label: { en: 'Content & copy', nl: 'Content & teksten' }, value: 'content' },
        { label: { en: 'Other', nl: 'Anders' }, value: 'other' },
      ],
    },
    { name: 'additionsOther', label: { en: 'Other addition', nl: 'Andere toevoeging' }, type: 'text' },
    { name: 'bericht', label: { en: 'Message', nl: 'Bericht' }, type: 'textarea' },
  ],
  timestamps: true,
}
