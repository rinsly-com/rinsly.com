import type { Block } from 'payload'

/**
 * `revenueCalculator` — what a partner would actually earn, worked out live.
 *
 * The persuasive part of the partner pitch is a number the studio recognises as
 * theirs, not a table of examples. So this block holds only its framing copy;
 * the plans, the rate ladder and the arithmetic live in the renderer
 * (`src/components/custom/RevenueCalculator.tsx`) because they must match
 * `~/Rinsly/ledger/src/domain/tenantRate.ts` exactly — a CMS field that could
 * drift from what the administration pays out would be worse than no field.
 *
 * Site-specific on purpose: it encodes Rinsly's commercial model, so it does not
 * belong in the shared engine.
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
