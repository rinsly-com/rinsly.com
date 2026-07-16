import type { TextField } from 'payload'

type IconFieldOptions = {
  /** Field name (defaults to `icon`). */
  name?: string
  label?: TextField['label']
  description?: NonNullable<TextField['admin']>['description']
}

/**
 * A reusable "pick a Tabler icon" field. Stores the icon's component name
 * (e.g. `IconHeart`) as text; the admin UI is the searchable visual
 * `IconSelector`, and the frontend renders it with `<Icon name={...} />`.
 *
 * Optional by design: leave it empty to fall back to the block's default icon.
 */
export const iconField = ({
  name = 'icon',
  label = { en: 'Icon', nl: 'Icoon' },
  description,
}: IconFieldOptions = {}): TextField => ({
  name,
  type: 'text',
  label,
  admin: {
    description:
      description ?? {
        en: 'Search and pick a Tabler icon. Leave empty to use the block’s default icon.',
        nl: 'Zoek en kies een Tabler-icoon. Laat leeg voor het standaardicoon van het blok.',
      },
    components: {
      Field: '/components/IconSelector#IconSelector',
    },
  },
})
