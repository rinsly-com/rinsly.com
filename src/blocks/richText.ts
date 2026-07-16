import type { Block } from 'payload'

import { anchorField } from '../fields/anchor'
import { sectionHeader } from '../fields/sectionHeader'

export const richTextBlock: Block = {
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: {
    singular: { en: 'Rich text', nl: 'Opgemaakte tekst' },
    plural: { en: 'Rich text sections', nl: 'Secties opgemaakte tekst' },
  },
  fields: [
    // Optional eyebrow/title/intro so a prose section matches the others.
    sectionHeader(['eyebrow', 'title', 'intro']),
    { name: 'content', label: { en: 'Content', nl: 'Inhoud' }, type: 'richText' },
    {
      name: 'width',
      label: { en: 'Width', nl: 'Breedte' },
      type: 'select',
      defaultValue: 'narrow',
      options: [
        { label: { en: 'Narrow (reading width)', nl: 'Smal (leesbreedte)' }, value: 'narrow' },
        { label: { en: 'Wide', nl: 'Breed' }, value: 'wide' },
      ],
    },
    anchorField(),
  ],
}
