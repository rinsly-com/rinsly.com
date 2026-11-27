'use client'

import type { Locale } from '@rinsly-com/site-core'
import { createPreviewShell } from '@rinsly-com/site-core/preview'

import type { Page } from '@/payload-types'
import { Contact } from '@/components/custom/Contact'
import { Diagram } from '@/components/custom/Diagram'
import { RevenueCalculator } from '@/components/custom/RevenueCalculator'
import { productRenderers } from '@/components/custom/product/renderers'
import { useKvkCollectionFlag } from '@/components/KvkCollectionFlag'

type BlockOf<T extends string> = Extract<NonNullable<Page['layout']>[number], { blockType: T }>

// The type parameter is how each call site names its block. The assertion is the use.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
const as = <T,>(block: unknown): T => block as T

/**
 * This site's block renderers, on the client, for live preview.
 *
 * It mirrors `@/blockRenderers` deliberately rather than importing it. That
 * module is passed to the engine's route factories as `extraRenderers` and is
 * therefore called during the SERVER render; marking it `'use client'` would
 * turn its exports into client references the server cannot invoke. Functions do
 * not cross the boundary in either direction, so the preview needs its own copy
 * of the map, built in a module the client bundle has imported for itself.
 *
 * Keep the two in step: a block registered in one and not the other either does
 * not render on the public site, or does not update as the editor types.
 */
export function PreviewContact(props: BlockOf<'contact'> & { locale: Locale }) {
  return <Contact {...props} kvkCollectionEnabled={useKvkCollectionFlag()} />
}

export const PreviewShell = createPreviewShell({
  contact: (block, locale) => <PreviewContact {...as<BlockOf<'contact'>>(block)} locale={locale} />,
  revenueCalculator: (block, locale) => (
    <RevenueCalculator {...as<BlockOf<'revenueCalculator'>>(block)} locale={locale} />
  ),
  diagram: (block, locale) => <Diagram {...as<BlockOf<'diagram'>>(block)} locale={locale} />,
  // The product-led blocks (redesign v5). Missing here, live preview rendered
  // them as nothing: only the core blocks of a v5 draft showed.
  ...productRenderers,
})
