import type { CollectionConfig } from 'payload'

import { adminFieldOnly } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: { en: 'User', nl: 'Gebruiker' },
    plural: { en: 'Users', nl: 'Gebruikers' },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'roles'],
  },
  auth: true,
  fields: [
    // Email added by default
    {
      name: 'roles',
      label: { en: 'Roles', nl: 'Rollen' },
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: ['editor'],
      options: [
        { label: { en: 'Admin', nl: 'Beheerder' }, value: 'admin' },
        { label: { en: 'Editor', nl: 'Redacteur' }, value: 'editor' },
      ],
      // Roles are saved into the JWT so access checks avoid a DB lookup.
      saveToJWT: true,
      access: {
        // Only admins may grant/revoke roles.
        update: adminFieldOnly,
      },
      admin: {
        description: {
          en: 'Editors manage content. Admins also manage users.',
          nl: 'Redacteuren beheren de inhoud. Beheerders beheren daarnaast gebruikers.',
        },
      },
    },
  ],
}
