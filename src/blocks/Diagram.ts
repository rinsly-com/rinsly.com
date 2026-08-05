import type { Block } from 'payload'

/**
 * `diagram` — a schematic, picked by name rather than uploaded.
 *
 * The drawings are inline SVG in `src/components/custom/Diagram.tsx`, not media
 * files, for three reasons that all matter more than editability:
 *
 *  - they use the site's design tokens, so they follow the light/dark theme and
 *    the brand accent instead of being baked at export time;
 *  - they stay crisp and weigh nothing, and need no R2 round-trip;
 *  - a diagram of how the business works is *documentation* — it should change in
 *    a reviewed commit alongside the thing it describes, not silently in a CMS.
 *
 * So the editor chooses which diagram and writes its caption; the drawing itself
 * is code. Adding one means a new `kind` here and a case in the renderer.
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
