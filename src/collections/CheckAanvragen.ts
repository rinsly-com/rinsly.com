import type { CollectionConfig } from 'payload'

import { authenticated } from '@rinsly-com/site-core/access'

/**
 * Check-aanvragen — free website-check requests from the generic /check page
 * (the LeadLens funnel's fallback for organic visitors and expired tokens).
 * Rows are created only via the public `/api/check-aanvraag` endpoint
 * (overrideAccess); direct API creation is closed. Managed by staff in the admin.
 */
export const CheckAanvragen: CollectionConfig = {
  slug: 'check-aanvragen',
  labels: {
    singular: { en: 'Website-check request', nl: 'Websitecheck-aanvraag' },
    plural: { en: 'Website-check requests', nl: 'Websitecheck-aanvragen' },
  },
  admin: {
    useAsTitle: 'url',
    defaultColumns: ['url', 'naam', 'telefoon', 'createdAt'],
  },
  access: {
    read: authenticated,
    create: () => false, // only via the /api/check-aanvraag endpoint (overrideAccess)
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'url', label: { en: 'Website', nl: 'Website' }, type: 'text', required: true },
    { name: 'naam', label: { en: 'Name', nl: 'Naam' }, type: 'text', required: true },
    { name: 'telefoon', label: { en: 'Phone', nl: 'Telefoonnummer' }, type: 'text', required: true },
  ],
  timestamps: true,
}
