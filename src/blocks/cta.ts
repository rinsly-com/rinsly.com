import type { Block } from 'payload'

import { anchorField } from '../fields/anchor'
import { link } from '../fields/link'

export const ctaBlock: Block = {
  slug: 'cta',
  interfaceName: 'CtaBlock',
  labels: {
    singular: { en: 'Call to action', nl: 'Oproep (CTA)' },
    plural: { en: 'Calls to action', nl: 'Oproepen (CTA)' },
  },
  fields: [
    { name: 'eyebrow', label: { en: 'Eyebrow', nl: 'Bovenlabel' }, type: 'text' },
    { name: 'title', label: { en: 'Title', nl: 'Titel' }, type: 'text', required: true },
    { name: 'text', label: { en: 'Text', nl: 'Tekst' }, type: 'textarea' },
    link({ name: 'button', label: { en: 'Button', nl: 'Knop' } }),
    anchorField(),
  ],
}
