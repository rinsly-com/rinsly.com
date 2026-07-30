import type { CollectionConfig } from 'payload'

import { authenticated } from '@rinsly-com/site-core/access'

/**
 * Check-runs — self-service website checks started from the /check page. One
 * row per run, so sales can see who checked what (the scorecard itself lives
 * in the leadlens-checks R2 bucket under the token). Rows are created only by
 * the /api/check-run endpoint (overrideAccess); the ipHash column exists for
 * rate limiting, not tracking.
 */
export const CheckRuns: CollectionConfig = {
  slug: 'check-runs',
  labels: {
    singular: { en: 'Website-check run', nl: 'Websitecheck-run' },
    plural: { en: 'Website-check runs', nl: 'Websitecheck-runs' },
  },
  admin: {
    useAsTitle: 'domain',
    defaultColumns: ['domain', 'token', 'createdAt'],
  },
  access: {
    read: authenticated,
    create: () => false, // only via the /api/check-run endpoint (overrideAccess)
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'domain', label: { en: 'Domain', nl: 'Domein' }, type: 'text', required: true },
    { name: 'token', label: 'Token', type: 'text', required: true, index: true },
    { name: 'ipHash', label: 'IP-hash', type: 'text', index: true },
  ],
  timestamps: true,
}
