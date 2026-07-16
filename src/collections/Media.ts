import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: { en: 'Media', nl: 'Media' },
    plural: { en: 'Media', nl: 'Media' },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      label: { en: 'Alt text', nl: 'Alt-tekst' },
      type: 'text',
      required: true,
      admin: {
        description: {
          en: 'Short description of the image for screen readers and when the image can’t load. Important for accessibility and SEO.',
          nl: 'Korte beschrijving van de afbeelding voor schermlezers en als de afbeelding niet laadt. Belangrijk voor toegankelijkheid en SEO.',
        },
      },
    },
  ],
  upload: {
    // Payload's built-in crop/focal tools. They apply server-side via sharp,
    // which is loaded in Node only (see payload.config.ts): cropping works in
    // local dev but is a no-op on the accp Worker, where sharp can't run.
    crop: true,
    focalPoint: true,
  },
}
