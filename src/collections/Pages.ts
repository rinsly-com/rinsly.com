import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { authenticated } from '../access/roles'
import { pageBlocks } from '../blocks'

/**
 * Pages — the site's content, one document per page. `title` and `layout` are
 * localized (nl/en) so a single document carries both languages; the slug is
 * shared across locales and drives the `/[locale]/[slug]` route. Native Payload
 * drafts/publish govern what the public site renders (published only).
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: { en: 'Page', nl: 'Pagina' },
    plural: { en: 'Pages', nl: "Pagina's" },
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: {
      autosave: false,
    },
    maxPerDoc: 50,
  },
  fields: [
    {
      name: 'title',
      label: { en: 'Title', nl: 'Titel' },
      type: 'text',
      required: true,
      localized: true,
    },
    // Auto-generates a sanitized slug from the title. Shared across locales
    // (the slug is the URL path; only the content behind it is translated).
    slugField({ position: 'sidebar' }),
    {
      name: 'layout',
      label: { en: 'Layout', nl: 'Indeling' },
      type: 'blocks',
      localized: true,
      blocks: pageBlocks,
      admin: {
        initCollapsed: true,
        description: {
          en: 'Page sections rendered on the site, in order.',
          nl: 'Paginasecties die op de site worden getoond, in volgorde.',
        },
      },
    },
  ],
  timestamps: true,
}
