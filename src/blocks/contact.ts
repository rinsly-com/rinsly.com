import type { Block } from 'payload'

import { anchorField } from '../fields/anchor'
import { linkGroup } from '../fields/link'
import { sectionHeader } from '../fields/sectionHeader'

export const contactBlock: Block = {
  slug: 'contact',
  interfaceName: 'ContactBlock',
  labels: {
    singular: { en: 'Contact', nl: 'Contact' },
    plural: { en: 'Contact sections', nl: 'Contactsecties' },
  },
  fields: [
    sectionHeader(['eyebrow', 'title', 'intro']),
    {
      name: 'showForm',
      label: { en: 'Show quote-request form', nl: 'Toon offerte-aanvraagformulier' },
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'items',
      label: { en: 'Contact details', nl: 'Contactgegevens' },
      type: 'array',
      labels: {
        singular: { en: 'Detail', nl: 'Gegeven' },
        plural: { en: 'Details', nl: 'Gegevens' },
      },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'kind',
          label: { en: 'Kind', nl: 'Soort' },
          type: 'select',
          defaultValue: 'text',
          options: [
            { label: { en: 'Email', nl: 'E-mail' }, value: 'email' },
            { label: { en: 'Phone', nl: 'Telefoon' }, value: 'phone' },
            { label: { en: 'Address', nl: 'Adres' }, value: 'address' },
            { label: { en: 'Other', nl: 'Overig' }, value: 'text' },
          ],
        },
        { name: 'label', label: { en: 'Label', nl: 'Label' }, type: 'text' },
        { name: 'value', label: { en: 'Value', nl: 'Waarde' }, type: 'text', required: true },
      ],
    },
    linkGroup(),
    anchorField(),
  ],
}
