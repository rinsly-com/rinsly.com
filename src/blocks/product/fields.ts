import type { Field, GroupField } from 'payload'

/**
 * Field helpers for the product-led blocks (redesign direction B, 27 Nov 2026).
 * Same link shape as site-core's `link` field, so `CMSLink` / `hrefFor` render
 * these buttons without an adapter. Kept app-side: site-core does not export
 * its field helpers.
 *
 * No `localized` on nested fields: the pages `layout` field is localized as a
 * whole, so every block row already belongs to one locale.
 */

const t = (en: string, nl: string) => ({ en, nl })

export const text = (name: string, en: string, nl: string, extra: Partial<Field> = {}): Field =>
  ({ name, label: t(en, nl), type: 'text', ...extra }) as Field

export const textarea = (name: string, en: string, nl: string, extra: Partial<Field> = {}): Field =>
  ({ name, label: t(en, nl), type: 'textarea', ...extra }) as Field

/** Every block has an anchor (public #hash for menu links). */
export const anchor = (): Field => ({
  name: 'anchor',
  label: t('Anchor ID', 'Anker-ID'),
  type: 'text',
  admin: {
    description: t(
      'Optional. Public hash for menu links. Lowercase letters, numbers and dashes.',
      'Optioneel. Publieke hash voor menu-links. Kleine letters, cijfers en streepjes.',
    ),
  },
})

/** Destination + label + variant, the site-core link shape. `required` makes the label required. */
export const linkFields = ({ required = true, variant = true }: { required?: boolean; variant?: boolean } = {}): Field[] => [
  {
    type: 'row',
    fields: [
      { name: 'label', label: t('Label', 'Label'), type: 'text', required, admin: { width: '50%' } },
      ...(variant
        ? ([
            {
              name: 'variant',
              label: t('Variant', 'Variant'),
              type: 'select',
              defaultValue: 'primary',
              options: [
                { label: t('Primary (filled button)', 'Primair (gevulde knop)'), value: 'primary' },
                { label: t('Secondary (text link)', 'Secundair (tekstlink)'), value: 'secondary' },
              ],
              admin: { width: '50%' },
            },
          ] as Field[])
        : []),
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'type',
        label: t('Type', 'Type'),
        type: 'radio',
        defaultValue: 'internal',
        options: [
          { label: t('Internal page', 'Interne pagina'), value: 'internal' },
          { label: t('External URL', 'Externe URL'), value: 'external' },
        ],
        admin: { width: '40%', layout: 'horizontal' },
      },
      {
        name: 'page',
        label: t('Page', 'Pagina'),
        type: 'relationship',
        relationTo: 'pages',
        admin: {
          width: '60%',
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          condition: (_data, sibling) => sibling?.['type'] === 'internal',
        },
      },
      {
        name: 'url',
        label: t('URL', 'URL'),
        type: 'text',
        admin: {
          width: '60%',
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          condition: (_data, sibling) => sibling?.['type'] === 'external',
        },
      },
    ],
  },
  {
    name: 'anchor',
    label: t('Section', 'Sectie'),
    type: 'text',
    admin: {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      condition: (_data, sibling) => sibling?.['type'] === 'internal',
    },
  },
  { name: 'newTab', label: t('Open in new tab', 'Openen in nieuw tabblad'), type: 'checkbox', defaultValue: false },
]

export const linkGroup = (name: string, en: string, nl: string, opts?: { required?: boolean; variant?: boolean }): GroupField => ({
  name,
  label: t(en, nl),
  type: 'group',
  fields: linkFields(opts),
})

/** A short list of single-line texts (bullets, trust lines). */
export const textList = (name: string, en: string, nl: string, min: number, max: number, required = true): Field => ({
  name,
  label: t(en, nl),
  type: 'array',
  minRows: min,
  maxRows: max,
  labels: { singular: t('Line', 'Regel'), plural: t('Lines', 'Regels') },
  fields: [{ name: 'text', label: t('Text', 'Tekst'), type: 'text', required }],
})

export { t }
