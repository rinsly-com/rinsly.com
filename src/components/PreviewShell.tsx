'use client'

import { createPreviewShell } from '@rinsly-com/site-core/preview'

import type { Page } from '@/payload-types'
import { Contact } from '@/components/custom/Contact'
import { Diagram } from '@/components/custom/Diagram'
import { RevenueCalculator } from '@/components/custom/RevenueCalculator'

type BlockOf<T extends string> = Extract<NonNullable<Page['layout']>[number], { blockType: T }>

const as = <T,>(block: unknown) => block as T

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
export const PreviewShell = createPreviewShell({
  contact: (block, locale) => <Contact {...as<BlockOf<'contact'>>(block)} locale={locale} />,
  revenueCalculator: (block, locale) => (
    <RevenueCalculator {...as<BlockOf<'revenueCalculator'>>(block)} locale={locale} />
  ),
  diagram: (block, locale) => <Diagram {...as<BlockOf<'diagram'>>(block)} locale={locale} />,
})
