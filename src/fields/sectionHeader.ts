import type { Field, GroupField } from 'payload'

import { iconField } from './icon'

export type SectionHeaderPart = 'icon' | 'eyebrow' | 'title' | 'subtitle' | 'intro'

/**
 * Standard section header shared by the blocks. Each block passes exactly the
 * parts its frontend component renders — a part that is not in the list is
 * not editable, so the admin UI never offers a field that would silently
 * disappear on the site.
 */
export const sectionHeader = (
  parts: SectionHeaderPart[] = ['icon', 'eyebrow', 'title', 'subtitle', 'intro'],
): GroupField => {
  const include = new Set(parts)
  const fields: Field[] = []

  if (include.has('icon')) {
    fields.push(
      iconField({
        name: 'icon',
        label: { en: 'Eyebrow icon', nl: 'Icoon boven de titel' },
        description: {
          en: 'Icon shown in the small label above the title. Leave empty for the default icon.',
          nl: 'Icoon in het kleine label boven de titel. Laat leeg voor het standaardicoon.',
        },
      }),
    )
  }
  if (include.has('eyebrow'))
    fields.push({
      name: 'eyebrow',
      label: { en: 'Eyebrow', nl: 'Bovenlabel' },
      type: 'text',
      admin: {
        description: {
          en: 'Small line of text shown above the title.',
          nl: 'Kleine tekstregel die boven de titel wordt getoond.',
        },
      },
    })
  if (include.has('title'))
    fields.push({ name: 'title', label: { en: 'Title', nl: 'Titel' }, type: 'text' })
  if (include.has('subtitle'))
    fields.push({ name: 'subtitle', label: { en: 'Subtitle', nl: 'Subtitel' }, type: 'text' })
  if (include.has('intro'))
    fields.push({
      name: 'intro',
      label: { en: 'Intro', nl: 'Intro' },
      type: 'textarea',
      admin: {
        description: {
          en: 'Introductory paragraph shown below the title.',
          nl: 'Inleidende alinea die onder de titel wordt getoond.',
        },
      },
    })

  return {
    name: 'header',
    label: { en: 'Section header', nl: 'Sectiekop' },
    type: 'group',
    fields,
  }
}
