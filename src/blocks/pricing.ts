import type { Block } from 'payload'

import { anchorField } from '../fields/anchor'
import { sectionHeader } from '../fields/sectionHeader'

export const pricingBlock: Block = {
  slug: 'pricing',
  interfaceName: 'PricingBlock',
  labels: {
    singular: { en: 'Pricing', nl: 'Prijzen' },
    plural: { en: 'Pricing sections', nl: 'Prijssecties' },
  },
  fields: [
    sectionHeader(['eyebrow', 'title', 'intro']),
    {
      name: 'tiers',
      label: { en: 'Tiers', nl: 'Pakketten' },
      type: 'array',
      labels: {
        singular: { en: 'Tier', nl: 'Pakket' },
        plural: { en: 'Tiers', nl: 'Pakketten' },
      },
      admin: { initCollapsed: true },
      fields: [
        { name: 'name', label: { en: 'Name', nl: 'Naam' }, type: 'text', required: true },
        {
          name: 'for',
          label: { en: 'For whom', nl: 'Voor wie' },
          type: 'text',
          admin: {
            description: {
              en: 'Short line describing who this tier is for.',
              nl: 'Korte regel die beschrijft voor wie dit pakket is.',
            },
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'price',
              label: { en: 'Price', nl: 'Prijs' },
              type: 'text',
              admin: { width: '50%', placeholder: '€110' },
            },
            {
              name: 'per',
              label: { en: 'Per', nl: 'Per' },
              type: 'text',
              admin: { width: '50%', placeholder: '/ mnd' },
            },
          ],
        },
        {
          name: 'priceNote',
          label: { en: 'Price note', nl: 'Prijstoelichting' },
          type: 'text',
          admin: {
            description: {
              en: 'e.g. “or €1.210 per year (1 month free)”.',
              nl: 'bijv. “of €1.210 per jaar (1 maand gratis)”.',
            },
          },
        },
        {
          name: 'recommended',
          label: { en: 'Recommended (highlight)', nl: 'Aanbevolen (uitgelicht)' },
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'badge',
          label: { en: 'Badge', nl: 'Label' },
          type: 'text',
          admin: {
            description: {
              en: 'Small badge shown on the highlighted tier, e.g. “Aanbevolen”.',
              nl: 'Klein label op het uitgelichte pakket, bijv. “Aanbevolen”.',
            },
          },
        },
        {
          name: 'features',
          label: { en: 'Features', nl: 'Kenmerken' },
          type: 'array',
          labels: {
            singular: { en: 'Feature', nl: 'Kenmerk' },
            plural: { en: 'Features', nl: 'Kenmerken' },
          },
          fields: [
            { name: 'text', label: { en: 'Text', nl: 'Tekst' }, type: 'text', required: true },
            {
              name: 'included',
              label: { en: 'Included', nl: 'Inbegrepen' },
              type: 'checkbox',
              defaultValue: true,
            },
          ],
        },
      ],
    },
    anchorField(),
  ],
}
