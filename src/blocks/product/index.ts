import type { Block } from 'payload'

import { anchor, linkFields, linkGroup, t, text, textarea, textList } from './fields'

/**
 * Product-led blocks (redesign direction B v5, spec
 * marketing/redesign-spec-2026-11-27.md §4). App-side `extraBlocks`: they
 * encode Rinsly's own offer pages, not engine features. Renderers live in
 * src/components/custom/product/renderers.tsx and are spread into both the
 * server map (`@/blockRenderers`) and the live-preview map (`PreviewShell`).
 * Schema: migration 20261127_200000_redesign_v5_blocks.
 */

/** §4.1 productHero: short H1, one-line sub, price chip, max two buttons, example-site frame. */
export const productHeroBlock: Block = {
  slug: 'productHero',
  interfaceName: 'ProductHeroBlock',
  labels: { singular: t('Product hero', 'Producthero'), plural: t('Product heroes', 'Productheroes') },
  fields: [
    text('eyebrow', 'Eyebrow', 'Bovenlabel'),
    text('title', 'Title (H1, at most 10 words)', 'Titel (H1, maximaal 10 woorden)', { required: true }),
    textarea('sub', 'Sub', 'Subregel', {
      required: true,
      admin: { description: t('One sentence, not a paragraph.', 'Eén zin, geen alinea.') },
    }),
    {
      name: 'priceChip',
      label: t('Price chip', 'Prijschip'),
      type: 'group',
      fields: [
        text('amount', 'Amount (e.g. €49 or 10%)', 'Bedrag (bijv. €49 of 10%)'),
        text('suffix', 'Suffix (e.g. per maand, excl. btw)', 'Toevoeging (bijv. per maand, excl. btw)'),
      ],
    },
    {
      name: 'buttons',
      label: t('Buttons', 'Knoppen'),
      type: 'array',
      maxRows: 2,
      admin: {
        description: t(
          'One primary button; a second one as a text link (Secondary).',
          'Eén primaire knop; een tweede als tekstlink (Secundair).',
        ),
      },
      labels: { singular: t('Button', 'Knop'), plural: t('Buttons', 'Knoppen') },
      fields: linkFields(),
    },
    {
      name: 'variant',
      label: t('Variant', 'Variant'),
      type: 'select',
      defaultValue: 'split',
      options: [
        { label: t('Split: copy left, example site right', 'Gesplitst: tekst links, voorbeeldsite rechts'), value: 'split' },
        { label: t('Compact: copy only', 'Compact: alleen tekst'), value: 'compact' },
      ],
    },
    {
      name: 'showcase',
      label: t('Example site frame', 'Voorbeeldsite-frame'),
      type: 'group',
      admin: {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        condition: (_data, sibling) => sibling?.['variant'] !== 'compact',
        description: t(
          'Decorative drawing of an example site (hidden on phones). Not a screenshot and not a claim.',
          'Decoratieve tekening van een voorbeeldsite (verborgen op telefoons). Geen screenshot en geen claim.',
        ),
      },
      fields: [
        {
          name: 'kind',
          label: t('Which example', 'Welk voorbeeld'),
          type: 'select',
          defaultValue: 'business',
          options: [
            { label: t('Business site', 'Bedrijfssite'), value: 'business' },
            { label: t('Plans / dashboard', 'Pakketten / dashboard'), value: 'plans' },
            { label: t('Studio portfolio', 'Studioportfolio'), value: 'studio' },
            { label: t('Live and staging environments', 'Live- en stagingomgeving'), value: 'environments' },
          ],
        },
        text('url', 'Address bar label', 'Label in de adresbalk'),
        text('badge', 'Overlay chip', 'Chip op het frame'),
        text('caption', 'Caption', 'Onderschrift'),
        { name: 'showPhone', label: t('Show the CMS phone', 'Toon de CMS-telefoon'), type: 'checkbox', defaultValue: false },
        // Redesign v8: the few words drawn inside the frames are content too (no copy in components).
        text('saveLabel', 'Save button in the phone', 'Opslaanknop in de telefoon', {
          admin: {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            condition: (_data, sibling) => sibling?.['showPhone'] === true,
            description: t('Empty: the button is drawn without text.', 'Leeg: de knop wordt zonder tekst getekend.'),
          },
        }),
        text('liveLabel', 'Label above the live window', 'Label boven het live-venster', {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          admin: { condition: (_data, sibling) => sibling?.['kind'] === 'environments' },
        }),
        text('stagingLabel', 'Label above the staging window', 'Label boven het stagingvenster', {
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          admin: { condition: (_data, sibling) => sibling?.['kind'] === 'environments' },
        }),
      ],
    },
    anchor(),
  ],
}

/** §4.2 productShowcase: copy beside a browser frame (here: the invoice/price list). */
export const productShowcaseBlock: Block = {
  slug: 'productShowcase',
  interfaceName: 'ProductShowcaseBlock',
  labels: { singular: t('Product showcase', 'Productshowcase'), plural: t('Product showcases', 'Productshowcases') },
  fields: [
    text('eyebrow', 'Eyebrow', 'Bovenlabel'),
    text('title', 'Title', 'Titel'),
    textarea('sub', 'Intro', 'Intro'),
    textList('bullets', 'Bullets', 'Opsomming', 0, 5),
    {
      name: 'layout',
      label: t('Layout', 'Indeling'),
      type: 'select',
      defaultValue: 'copyLeft',
      options: [
        { label: t('Copy left', 'Tekst links'), value: 'copyLeft' },
        { label: t('Copy right', 'Tekst rechts'), value: 'copyRight' },
      ],
    },
    {
      name: 'frame',
      label: t('Frame', 'Frame'),
      type: 'group',
      fields: [
        {
          name: 'kind',
          label: t('Frame content', 'Inhoud van het frame'),
          type: 'select',
          defaultValue: 'invoice',
          options: [
            { label: t('Price list / invoice rows', 'Prijslijst / factuurregels'), value: 'invoice' },
            { label: t('Example site', 'Voorbeeldsite'), value: 'site' },
            { label: t('CMS', 'CMS'), value: 'cms' },
          ],
        },
        text('url', 'Address bar label', 'Label in de adresbalk'),
        text('title', 'Heading inside the frame', 'Kop in het frame'),
      ],
    },
    {
      name: 'invoiceRows',
      label: t('Rows (price list)', 'Regels (prijslijst)'),
      type: 'array',
      maxRows: 8,
      admin: {
        condition: (_data, sibling) => (sibling as { frame?: { kind?: string } } | undefined)?.frame?.kind === 'invoice',
        description: t('Live prices only.', 'Alleen live prijzen.'),
      },
      fields: [
        { type: 'row', fields: [text('label', 'Label', 'Label', { required: true }), text('amount', 'Amount', 'Bedrag', { required: true })] },
      ],
    },
    linkGroup('button', 'Button (optional)', 'Knop (optioneel)', { required: false }),
    anchor(),
  ],
}

/** §4.3 stepsShowcase: three steps, each with a small frame (wireframe → live → CMS). */
export const stepsShowcaseBlock: Block = {
  slug: 'stepsShowcase',
  interfaceName: 'StepsShowcaseBlock',
  labels: { singular: t('Steps showcase', 'Stappen met frames'), plural: t('Steps showcases', 'Stappen met frames') },
  fields: [
    text('eyebrow', 'Eyebrow', 'Bovenlabel'),
    text('title', 'Title', 'Titel'),
    textarea('intro', 'Intro', 'Intro'),
    {
      name: 'steps',
      label: t('Steps', 'Stappen'),
      type: 'array',
      minRows: 3,
      maxRows: 3,
      labels: { singular: t('Step', 'Stap'), plural: t('Steps', 'Stappen') },
      fields: [
        text('label', 'Label (e.g. Stap 1)', 'Label (bijv. Stap 1)'),
        text('title', 'Title', 'Titel', { required: true }),
        textarea('text', 'Text', 'Tekst'),
        {
          name: 'frameKind',
          label: t('Frame', 'Frame'),
          type: 'select',
          required: true,
          defaultValue: 'wireframe',
          options: [
            { label: t('Wireframe', 'Wireframe'), value: 'wireframe' },
            { label: t('Live site', 'Live site'), value: 'live' },
            { label: t('CMS', 'CMS'), value: 'cms' },
          ],
        },
      ],
    },
    anchor(),
  ],
}

/** §4.4 doorCards: the two home doors as offer cards (2 or 3 bullets, price, one button each). */
export const doorCardsBlock: Block = {
  slug: 'doorCards',
  interfaceName: 'DoorCardsBlock',
  labels: { singular: t('Door cards', 'Deurkaarten'), plural: t('Door cards', 'Deurkaarten') },
  fields: [
    text('eyebrow', 'Eyebrow', 'Bovenlabel'),
    text('title', 'Title', 'Titel'),
    {
      name: 'doors',
      label: t('Doors', 'Deuren'),
      type: 'array',
      minRows: 2,
      maxRows: 2,
      labels: { singular: t('Door', 'Deur'), plural: t('Doors', 'Deuren') },
      fields: [
        text('label', 'Label (e.g. Deur 1)', 'Label (bijv. Deur 1)'),
        text('title', 'Title', 'Titel', { required: true }),
        { type: 'row', fields: [text('price', 'Price or %', 'Prijs of %'), text('priceNote', 'Price note', 'Toelichting bij de prijs')] },
        text('howLine', 'Line above the bullets', 'Regel boven de opsomming'),
        textList('bullets', 'Bullets (2 or 3)', 'Opsomming (2 of 3)', 2, 3),
        textarea('finePrint', 'Fine print (above the button)', 'Kleine letters (boven de knop)'),
        linkGroup('button', 'Button', 'Knop'),
      ],
    },
    anchor(),
  ],
}

/** §4.5 pricingCards: the live plans, each with its own button. */
export const pricingCardsBlock: Block = {
  slug: 'pricingCards',
  interfaceName: 'PricingCardsBlock',
  labels: { singular: t('Pricing cards', 'Prijskaarten'), plural: t('Pricing cards', 'Prijskaarten') },
  fields: [
    text('eyebrow', 'Eyebrow', 'Bovenlabel'),
    text('title', 'Title', 'Titel'),
    {
      name: 'plans',
      label: t('Plans', 'Pakketten'),
      type: 'array',
      minRows: 1,
      maxRows: 4,
      admin: { description: t('Live plans and prices only.', 'Alleen live pakketten en prijzen.') },
      labels: { singular: t('Plan', 'Pakket'), plural: t('Plans', 'Pakketten') },
      fields: [
        { type: 'row', fields: [text('title', 'Name', 'Naam', { required: true }), text('tag', 'Tag (e.g. Aanbevolen)', 'Label (bijv. Aanbevolen)')] },
        text('tagline', 'Tagline', 'Ondertitel'),
        { type: 'row', fields: [text('price', 'Price', 'Prijs'), text('period', 'Period', 'Periode')] },
        text('priceNote', 'Price note (yearly price)', 'Toelichting (jaarprijs)'),
        {
          name: 'features',
          label: t('Features', 'Kenmerken'),
          type: 'array',
          labels: { singular: t('Feature', 'Kenmerk'), plural: t('Features', 'Kenmerken') },
          fields: [
            { type: 'row', fields: [
              text('text', 'Text', 'Tekst', { required: true }),
              { name: 'included', label: t('Included', 'Inbegrepen'), type: 'checkbox', defaultValue: true },
            ] },
          ],
        },
        linkGroup('button', 'Button', 'Knop'),
        { name: 'featured', label: t('Recommended (highlighted)', 'Aanbevolen (uitgelicht)'), type: 'checkbox', defaultValue: false },
      ],
    },
    text('sharedLine', 'Line under the cards', 'Regel onder de kaarten'),
    textarea('limitsNote', 'Limits note', 'Toelichting limieten'),
    anchor(),
  ],
}

/** §4.6 ladderSteps: the partner ladder as four equal rungs plus one footnote. */
export const ladderStepsBlock: Block = {
  slug: 'ladderSteps',
  interfaceName: 'LadderStepsBlock',
  labels: { singular: t('Ladder', 'Ladder'), plural: t('Ladders', 'Ladders') },
  fields: [
    text('eyebrow', 'Eyebrow', 'Bovenlabel'),
    text('title', 'Title', 'Titel'),
    textarea('intro', 'Intro', 'Intro'),
    {
      name: 'rungs',
      label: t('Rungs', 'Treden'),
      type: 'array',
      minRows: 1,
      maxRows: 4,
      labels: { singular: t('Rung', 'Trede'), plural: t('Rungs', 'Treden') },
      fields: [
        { type: 'row', fields: [text('name', 'Name', 'Naam', { required: true }), text('percent', 'Percentage (e.g. 10% or +10%)', 'Percentage (bijv. 10% of +10%)', { required: true })] },
        text('text', 'Text', 'Tekst'),
      ],
    },
    textarea('footnote', 'Footnote (terms, maximum)', 'Voetnoot (voorwaarden, maximum)'),
    anchor(),
  ],
}

/** §4.8 trustBar: three or four short lines, not a card grid. */
export const trustBarBlock: Block = {
  slug: 'trustBar',
  interfaceName: 'TrustBarBlock',
  labels: { singular: t('Trust bar', 'Vertrouwensbalk'), plural: t('Trust bars', 'Vertrouwensbalken') },
  fields: [textList('items', 'Lines (3 or 4)', 'Regels (3 of 4)', 3, 4), anchor()],
}

export const productBlocks: Block[] = [
  productHeroBlock,
  doorCardsBlock,
  stepsShowcaseBlock,
  trustBarBlock,
  pricingCardsBlock,
  productShowcaseBlock,
  ladderStepsBlock,
]
