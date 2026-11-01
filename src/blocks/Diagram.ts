import type { Block } from 'payload'

/**
 * `diagram` — the editor picks a kind and writes the caption. The drawing is
 * inline SVG in Diagram.tsx (theme tokens, no media). A new kind is a new
 * option here plus a case in the renderer.
 */
export const diagramBlock: Block = {
  slug: 'diagram',
  interfaceName: 'DiagramBlock',
  labels: {
    singular: { en: 'Diagram', nl: 'Diagram' },
    plural: { en: 'Diagrams', nl: 'Diagrammen' },
  },
  fields: [
    {
      name: 'kind',
      label: { en: 'Which diagram', nl: 'Welk diagram' },
      type: 'select',
      required: true,
      defaultValue: 'figmaToProduction',
      options: [
        {
          label: { en: 'Figma → production', nl: 'Figma → productie' },
          value: 'figmaToProduction',
        },
        {
          label: { en: 'One engine, the whole fleet', nl: 'Eén engine, de hele fleet' },
          value: 'oneEngineFleet',
        },
        {
          label: { en: 'Who invoices whom', nl: 'Wie factureert wie' },
          value: 'invoicingRoutes',
        },
      ],
    },
    { name: 'eyebrow', label: { en: 'Eyebrow', nl: 'Bovenkop' }, type: 'text', localized: true },
    { name: 'title', label: { en: 'Title', nl: 'Titel' }, type: 'text', localized: true },
    {
      name: 'caption',
      label: { en: 'Caption', nl: 'Onderschrift' },
      type: 'textarea',
      localized: true,
      admin: {
        description: {
          en: 'Read by screen readers as the figure’s description, so say what the diagram shows: do not leave it empty.',
          nl: 'Wordt door schermlezers als beschrijving van de figuur gelezen, dus zeg wat het diagram toont: laat dit niet leeg.',
        },
      },
    },
    {
      name: 'anchor',
      label: { en: 'Anchor ID', nl: 'Anker-ID' },
      type: 'text',
    },
  ],
}
