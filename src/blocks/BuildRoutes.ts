import type { Block } from 'payload'

/**
 * `buildRoutes` — the two ways a client pays for the build.
 *
 * The free-build route is the lead (rendered first and largest). Paying the
 * build up front is the alternative (rendered second and quieter). The words
 * and figures are CMS fields so a price change does not need a code change;
 * the layout does not, because which route leads is a product decision.
 *
 * Site-specific on purpose: it encodes Rinsly's commercial model, so it stays
 * app-side rather than going into the shared engine. It is one small block,
 * not a second `pricing` table — the home and pricing pages already sit on
 * D1's per-query parameter limit with a single four-tier pricing block.
 */
export const buildRoutesBlock: Block = {
  slug: 'buildRoutes',
  interfaceName: 'BuildRoutesBlock',
  labels: {
    singular: { en: 'Build routes', nl: 'Bouwroutes' },
    plural: { en: 'Build routes', nl: 'Bouwroutes' },
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
      name: 'primaryLabel',
      label: { en: 'Lead route name', nl: 'Naam van de voorste route' },
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: {
          en: 'Shown first and largest. This is the route the page leads with.',
          nl: 'Staat vooraan en het grootst. Dit is de route waarmee de pagina opent.',
        },
      },
    },
    {
      name: 'primaryPrice',
      label: { en: 'Lead route price', nl: 'Prijs van de voorste route' },
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'primaryTerm',
      label: { en: 'Lead route term', nl: 'Looptijd van de voorste route' },
      type: 'textarea',
      localized: true,
      required: true,
    },
    {
      name: 'alternativeKicker',
      label: { en: 'Alternative kicker', nl: 'Kopje boven het alternatief' },
      type: 'text',
      localized: true,
      admin: {
        description: {
          en: 'Small line above the second route, e.g. “Or”. Leave empty to show none.',
          nl: 'Kleine regel boven de tweede route, bijvoorbeeld “Of”. Laat leeg om niets te tonen.',
        },
      },
    },
    {
      name: 'alternativeLabel',
      label: { en: 'Alternative name', nl: 'Naam van het alternatief' },
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: {
          en: 'Shown second, smaller and quieter than the lead route.',
          nl: 'Staat als tweede, kleiner en stiller dan de voorste route.',
        },
      },
    },
    {
      name: 'alternativePrice',
      label: { en: 'Alternative price', nl: 'Prijs van het alternatief' },
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'alternativeTerm',
      label: { en: 'Alternative term', nl: 'Looptijd van het alternatief' },
      type: 'textarea',
      localized: true,
      required: true,
    },
    {
      name: 'footnote',
      label: { en: 'Footnote', nl: 'Voetnoot' },
      type: 'textarea',
      localized: true,
      admin: {
        description: {
          en: 'Small print under both routes, such as VAT.',
          nl: 'Kleine letters onder beide routes, zoals btw.',
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
