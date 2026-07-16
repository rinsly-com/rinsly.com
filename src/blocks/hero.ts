import type { Block } from 'payload'

import { anchorField } from '../fields/anchor'
import { linkGroup } from '../fields/link'
import { sectionHeader } from '../fields/sectionHeader'

export const heroBlock: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: {
    singular: { en: 'Hero', nl: 'Hero' },
    plural: { en: 'Heroes', nl: "Hero's" },
  },
  fields: [
    // Eyebrow + large title + lede paragraph, plus CTA buttons.
    sectionHeader(['eyebrow', 'title', 'intro']),
    linkGroup(),
    anchorField(),
  ],
}
