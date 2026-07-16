import type { GlobalConfig } from 'payload'

import { authenticated } from '../access/roles'
import { navLinkFields } from '../fields/link'

/**
 * Header — site navigation menu and the header call-to-action button. Menu
 * items reference Pages documents (or an external URL), so links follow a page
 * when its slug changes. The nav and CTA are localized so each language has its
 * own labels (and, if desired, its own targets).
 */
export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'logo',
      label: 'Logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: {
          en: 'Logo shown at the top-left of the header. Leave empty for the default Rinsly mark.',
          nl: 'Logo linksboven in de header. Laat leeg voor het standaard Rinsly-merk.',
        },
      },
    },
    {
      name: 'navItems',
      label: { en: 'Menu items', nl: 'Menu-items' },
      type: 'array',
      localized: true,
      labels: {
        singular: { en: 'Menu item', nl: 'Menu-item' },
        plural: { en: 'Menu items', nl: 'Menu-items' },
      },
      admin: {
        description: {
          en: 'The navigation links shown in the header, in order.',
          nl: 'De navigatielinks in de header, in volgorde.',
        },
      },
      fields: navLinkFields(),
    },
    {
      name: 'cta',
      label: { en: 'Call to action', nl: 'Actieknop' },
      type: 'group',
      localized: true,
      admin: {
        description: {
          en: 'The button on the right side of the header. Leave the label empty to hide it.',
          nl: 'De knop rechts in de header. Laat het label leeg om hem te verbergen.',
        },
      },
      fields: navLinkFields({ requiredLabel: false }),
    },
  ],
}
