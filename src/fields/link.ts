import type { ArrayField, Field, GroupField, RowField } from 'payload'

/**
 * Reusable link/button field group (pattern from Payload's website template):
 * a label plus either an internal Pages reference (follows the page if its
 * slug changes) or an external URL, with a visual variant.
 */
type LinkArgs = {
  name?: string
  label?: string | Record<string, string>
  /**
   * Include the visual variant select. Only links rendered through
   * `CMSLink`/`Buttons` use it; standalone links with fixed styling (service
   * cards, vacancy cards, the hero certification, the social badge) pass
   * `variant: false` so the admin UI never shows a select that has no effect.
   */
  variant?: boolean
}

/** The link destination row: internal Pages reference or external URL. */
const destinationRow = (): RowField => ({
  type: 'row',
  fields: [
    {
      name: 'type',
      label: { en: 'Type', nl: 'Type' },
      type: 'radio',
      defaultValue: 'internal',
      options: [
        { label: { en: 'Internal page', nl: 'Interne pagina' }, value: 'internal' },
        { label: { en: 'External URL', nl: 'Externe URL' }, value: 'external' },
      ],
      admin: {
        width: '40%',
        layout: 'horizontal',
        description: {
          en: 'Link to a page on this site (follows the page if its address changes) or to an external web address.',
          nl: 'Link naar een pagina op deze site (volgt de pagina als het adres verandert) of naar een extern webadres.',
        },
      },
    },
    {
      name: 'page',
      label: { en: 'Page', nl: 'Pagina' },
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        width: '60%',
        condition: (_data, siblingData) => siblingData?.type === 'internal',
      },
    },
    {
      name: 'url',
      label: { en: 'URL', nl: 'URL' },
      type: 'text',
      admin: {
        width: '60%',
        condition: (_data, siblingData) => siblingData?.type === 'external',
        description: {
          en: 'Full web address, including https://',
          nl: 'Volledig webadres, inclusief https://',
        },
      },
    },
  ],
})

/**
 * The link destination fields: the internal/external row plus an optional
 * section anchor to scroll to. `hrefFor` appends it as `/[locale]/slug#anchor`.
 */
const destinationFields = (): Field[] => [
  destinationRow(),
  {
    name: 'anchor',
    label: { en: 'Section', nl: 'Sectie' },
    type: 'text',
    admin: {
      description: {
        en: 'Optional. Anchor ID of a section on the selected page (e.g. “prijzen”). Lowercase letters, numbers and dashes.',
        nl: 'Optioneel. Anker-ID van een sectie op de gekozen pagina (bijv. “prijzen”). Kleine letters, cijfers en streepjes.',
      },
      condition: (_data, siblingData) => siblingData?.type === 'internal',
    },
  },
]

export const link = ({ name = 'link', label = 'Link', variant = true }: LinkArgs = {}): GroupField => ({
  name,
  label,
  type: 'group',
  fields: [
    variant
      ? {
          type: 'row',
          fields: [
            {
              name: 'label',
              label: { en: 'Label', nl: 'Label' },
              type: 'text',
              required: true,
              admin: {
                width: '50%',
                description: {
                  en: 'The text shown on the button.',
                  nl: 'De tekst die op de knop wordt getoond.',
                },
              },
            },
            {
              name: 'variant',
              label: { en: 'Variant', nl: 'Variant' },
              type: 'select',
              defaultValue: 'primary',
              options: [
                { label: { en: 'Primary (teal pill)', nl: 'Primair (turquoise knop)' }, value: 'primary' },
                { label: { en: 'Secondary (text + arrow)', nl: 'Secundair (tekst + pijl)' }, value: 'secondary' },
              ],
              admin: {
                width: '50%',
                description: {
                  en: 'Visual style of the button.',
                  nl: 'Visuele stijl van de knop.',
                },
              },
            },
          ],
        }
      : {
          name: 'label',
          label: { en: 'Label', nl: 'Label' },
          type: 'text',
          required: true,
          admin: {
            description: {
              en: 'The text shown on the link.',
              nl: 'De tekst die op de link wordt getoond.',
            },
          },
        },
    ...destinationFields(),
    {
      name: 'newTab',
      type: 'checkbox',
      label: { en: 'Open in new tab', nl: 'Openen in nieuw tabblad' },
      defaultValue: false,
    },
  ],
})

/**
 * Link fields without the visual variant — for navigation menus (header nav
 * items, the header CTA) where the styling is fixed by the layout.
 * `requiredLabel: false` makes the whole link optional (e.g. an optional CTA
 * inside a group, where a required label would block saving the global).
 */
export const navLinkFields = ({ requiredLabel = true }: { requiredLabel?: boolean } = {}): Field[] => [
  {
    name: 'label',
    label: { en: 'Label', nl: 'Label' },
    type: 'text',
    required: requiredLabel,
    admin: {
      description: {
        en: 'The text shown on the link.',
        nl: 'De tekst die op de link wordt getoond.',
      },
    },
  },
  ...destinationFields(),
  {
    name: 'newTab',
    type: 'checkbox',
    label: { en: 'Open in new tab', nl: 'Openen in nieuw tabblad' },
    defaultValue: false,
  },
]

/** An unbounded list of links/buttons — any block can carry 0…N of them. */
export const linkGroup = ({
  name = 'buttons',
  label = { en: 'Buttons', nl: 'Knoppen' },
}: LinkArgs = {}): ArrayField => ({
  name,
  label,
  type: 'array',
  labels: {
    singular: { en: 'Button', nl: 'Knop' },
    plural: { en: 'Buttons', nl: 'Knoppen' },
  },
  admin: { initCollapsed: true },
  fields: link({ name: 'link' }).fields,
})
