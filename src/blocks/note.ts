import type { Block } from 'payload'

import { anchorField } from '../fields/anchor'

/** A small, subtle callout line (e.g. a reassuring aside under a section). */
export const noteBlock: Block = {
  slug: 'note',
  interfaceName: 'NoteBlock',
  labels: {
    singular: { en: 'Note', nl: 'Notitie' },
    plural: { en: 'Notes', nl: 'Notities' },
  },
  fields: [
    { name: 'text', label: { en: 'Text', nl: 'Tekst' }, type: 'textarea', required: true },
    anchorField(),
  ],
}
