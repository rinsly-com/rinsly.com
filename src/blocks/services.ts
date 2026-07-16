import type { Block } from 'payload'

import { anchorField } from '../fields/anchor'
import { iconField } from '../fields/icon'
import { sectionHeader } from '../fields/sectionHeader'

export const servicesBlock: Block = {
  slug: 'services',
  interfaceName: 'ServicesBlock',
  labels: {
    singular: { en: 'Services', nl: 'Diensten' },
    plural: { en: 'Services sections', nl: 'Dienstensecties' },
  },
  fields: [
    sectionHeader(['eyebrow', 'title', 'intro']),
    {
      name: 'cards',
      label: { en: 'Cards', nl: 'Kaarten' },
      type: 'array',
      labels: {
        singular: { en: 'Card', nl: 'Kaart' },
        plural: { en: 'Cards', nl: 'Kaarten' },
      },
      admin: { initCollapsed: true },
      fields: [
        iconField({ name: 'icon', label: { en: 'Icon', nl: 'Icoon' } }),
        { name: 'title', label: { en: 'Title', nl: 'Titel' }, type: 'text', required: true },
        { name: 'description', label: { en: 'Description', nl: 'Omschrijving' }, type: 'textarea' },
        {
          name: 'features',
          label: { en: 'Features', nl: 'Kenmerken' },
          type: 'array',
          labels: {
            singular: { en: 'Feature', nl: 'Kenmerk' },
            plural: { en: 'Features', nl: 'Kenmerken' },
          },
          fields: [{ name: 'text', label: { en: 'Text', nl: 'Tekst' }, type: 'text', required: true }],
        },
      ],
    },
    anchorField(),
  ],
}
