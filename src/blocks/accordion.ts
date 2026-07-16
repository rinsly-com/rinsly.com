import type { Block } from 'payload'

import { anchorField } from '../fields/anchor'
import { basicEditor } from '../fields/basicEditor'
import { sectionHeader } from '../fields/sectionHeader'

export const accordionBlock: Block = {
  slug: 'accordion',
  interfaceName: 'AccordionBlock',
  labels: {
    singular: { en: 'Accordion', nl: 'Accordeon' },
    plural: { en: 'Accordions', nl: 'Accordeons' },
  },
  fields: [
    // The accordion renders its eyebrow as plain text, without an icon pill.
    sectionHeader(['eyebrow', 'title', 'subtitle', 'intro']),
    {
      name: 'items',
      label: { en: 'Items', nl: 'Items' },
      labels: {
        singular: { en: 'Item', nl: 'Item' },
        plural: { en: 'Items', nl: 'Items' },
      },
      type: 'array',
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', label: { en: 'Title', nl: 'Titel' }, type: 'text', required: true },
        { name: 'body', label: { en: 'Body', nl: 'Tekst' }, type: 'richText', editor: basicEditor },
      ],
    },
    anchorField(),
  ],
}
