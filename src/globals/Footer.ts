import type { GlobalConfig } from 'payload'

import { authenticated } from '../access/roles'

/**
 * Footer — tagline, contact details, company registration, link lists and
 * copyright. Text that reads differently per language (tagline, link labels,
 * copyright) is localized; hard facts (email, phone, address, KvK, BTW) are
 * shared across locales.
 */
export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: authenticated,
  },
  fields: [
    {
      name: 'logo',
      label: 'Logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: {
          en: 'Logo shown in the footer. Leave empty for the default Rinsly mark.',
          nl: 'Logo in de footer. Laat leeg voor het standaard Rinsly-merk.',
        },
      },
    },
    {
      name: 'tagline',
      label: { en: 'Tagline', nl: 'Slogan' },
      type: 'textarea',
      localized: true,
    },
    { name: 'email', label: { en: 'Email', nl: 'E-mail' }, type: 'text' },
    { name: 'phone', label: { en: 'Phone', nl: 'Telefoon' }, type: 'text' },
    { name: 'address', label: { en: 'Address', nl: 'Adres' }, type: 'text' },
    { name: 'kvk', label: { en: 'Chamber of Commerce (KvK)', nl: 'KvK' }, type: 'text' },
    { name: 'btw', label: { en: 'VAT (BTW)', nl: 'BTW' }, type: 'text' },
    {
      name: 'menuItems',
      label: { en: 'Menu items', nl: 'Menu-items' },
      type: 'array',
      localized: true,
      labels: {
        singular: { en: 'Menu item', nl: 'Menu-item' },
        plural: { en: 'Menu items', nl: 'Menu-items' },
      },
      fields: [
        { name: 'label', label: { en: 'Label', nl: 'Label' }, type: 'text' },
        { name: 'url', label: { en: 'URL', nl: 'URL' }, type: 'text' },
      ],
    },
    {
      name: 'infoLinks',
      label: { en: 'Info links', nl: 'Info-links' },
      type: 'array',
      localized: true,
      labels: {
        singular: { en: 'Info link', nl: 'Info-link' },
        plural: { en: 'Info links', nl: 'Info-links' },
      },
      fields: [
        { name: 'label', label: { en: 'Label', nl: 'Label' }, type: 'text' },
        { name: 'url', label: { en: 'URL', nl: 'URL' }, type: 'text' },
      ],
    },
    { name: 'copyright', label: { en: 'Copyright', nl: 'Copyright' }, type: 'text', localized: true },
  ],
}
