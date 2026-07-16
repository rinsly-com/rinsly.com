import type { Block } from 'payload'

import { anchorField } from '../fields/anchor'
import { linkGroup } from '../fields/link'

export const buttonRowBlock: Block = {
  slug: 'buttonRow',
  interfaceName: 'ButtonRowBlock',
  labels: {
    singular: { en: 'Button row', nl: 'Knoppenrij' },
    plural: { en: 'Button rows', nl: 'Knoppenrijen' },
  },
  fields: [
    linkGroup(),
    {
      name: 'alignment',
      label: { en: 'Alignment', nl: 'Uitlijning' },
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: { en: 'Left', nl: 'Links' }, value: 'left' },
        { label: { en: 'Center', nl: 'Midden' }, value: 'center' },
        { label: { en: 'Right', nl: 'Rechts' }, value: 'right' },
      ],
    },
    anchorField(),
  ],
}
