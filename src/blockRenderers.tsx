import type { BlockRenderer } from '@rinsly-com/site-core'

import type { Page } from '@/payload-types'
import { Contact } from '@/components/custom/Contact'
import { Diagram } from '@/components/custom/Diagram'
import { RevenueCalculator } from '@/components/custom/RevenueCalculator'

type BlockOf<T extends string> = Extract<NonNullable<Page['layout']>[number], { blockType: T }>

/**
 * The engine hands renderers a loose `AnyBlock`, so narrowing to a generated
 * block type needs a double assertion whenever that type has a required field
 * (`diagram.kind`). The dispatch key already guarantees the shape.
 */
// The type parameter is how each call site names its block. The assertion is the use.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
const as = <T,>(block: unknown): T => block as T

/**
 * Rinsly's custom block renderers, passed to the engine's route factories.
 *
 * `contact` OVERRIDES the engine's core renderer (app renderers take precedence
 * for the same blockType) to mount the OfferteForm wizard; the other two are
 * blocks the engine does not have, registered via `extraBlocks` in
 * payload.config.ts.
 */
export const extraRenderers: Record<string, BlockRenderer> = {
  contact: (block, locale) => <Contact {...as<BlockOf<'contact'>>(block)} locale={locale} />,
  revenueCalculator: (block, locale) => (
    <RevenueCalculator {...as<BlockOf<'revenueCalculator'>>(block)} locale={locale} />
  ),
  diagram: (block, locale) => <Diagram {...as<BlockOf<'diagram'>>(block)} locale={locale} />,
}
