import type { Block } from 'payload'

/**
 * `revenueCalculator` — framing copy only. Plans and arithmetic stay in
 * RevenueCalculator.tsx so they cannot drift from Ledger's tenantRate.ts.
 * Site-specific: this is Rinsly's commercial model, not an engine block.
 */
export const revenueCalculatorBlock: Block = {
  slug: 'revenueCalculator',
  interfaceName: 'RevenueCalculatorBlock',
  labels: {
    singular: { en: 'Revenue calculator', nl: 'Omzetcalculator' },
    plural: { en: 'Revenue calculators', nl: 'Omzetcalculators' },
  },
  fields: [
    {
      name: 'eyebrow',
      label: { en: 'Eyebrow', nl: 'Bovenkop' },
      type: 'text',
      localized: true,
    },
    { name: 'title', label: { en: 'Title', nl: 'Titel' }, type: 'text', localized: true },
    {
      name: 'intro',
      label: { en: 'Intro', nl: 'Intro' },
      type: 'textarea',
      localized: true,
    },
    {
      name: 'footnote',
      label: { en: 'Footnote', nl: 'Voetnoot' },
      type: 'textarea',
      localized: true,
      admin: {
        description: {
          en: 'Small print under the result: use it for the caveats, not for selling.',
          nl: 'Kleine letters onder de uitkomst: voor de voorbehouden, niet om te verkopen.',
        },
      },
    },
    {
      name: 'anchor',
      label: { en: 'Anchor ID', nl: 'Anker-ID' },
      type: 'text',
      admin: {
        description: {
          en: 'Optional #id so the section can be linked to.',
          nl: 'Optioneel #id zodat er naar deze sectie gelinkt kan worden.',
        },
      },
    },
  ],
}
