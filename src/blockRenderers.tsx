import type { BlockRenderer } from '@rinsly-com/site-core'

import type { Page } from '@/payload-types'
import { Contact } from '@/components/custom/Contact'
import { Diagram } from '@/components/custom/Diagram'
import { RevenueCalculator } from '@/components/custom/RevenueCalculator'
import { DoorCards } from '@/components/custom/product/DoorCards'
import { LadderSteps } from '@/components/custom/product/LadderSteps'
import { PricingCards } from '@/components/custom/product/PricingCards'
import { ProductHero } from '@/components/custom/product/ProductHero'
import { ProductShowcase } from '@/components/custom/product/ProductShowcase'
import { StepsShowcase } from '@/components/custom/product/StepsShowcase'
import { TrustBar } from '@/components/custom/product/TrustBar'
import { isKvkCollectionEnabled } from '@/lib/kvkCollectionFlag'

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
 * for the same blockType) to mount the OfferteForm wizard; the others are
 * blocks the engine does not have, registered via `extraBlocks` in
 * payload.config.ts (the product-led ones: src/blocks/product).
 */
export const extraRenderers: Record<string, BlockRenderer> = {
  contact: (block, locale) => (
    <Contact {...as<BlockOf<'contact'>>(block)} locale={locale} kvkCollectionEnabled={isKvkCollectionEnabled()} />
  ),
  revenueCalculator: (block, locale) => (
    <RevenueCalculator {...as<BlockOf<'revenueCalculator'>>(block)} locale={locale} />
  ),
  diagram: (block, locale) => <Diagram {...as<BlockOf<'diagram'>>(block)} locale={locale} />,
  productHero: (block, locale) => <ProductHero {...as<BlockOf<'productHero'>>(block)} locale={locale} />,
  doorCards: (block, locale) => <DoorCards {...as<BlockOf<'doorCards'>>(block)} locale={locale} />,
  stepsShowcase: (block) => <StepsShowcase {...as<BlockOf<'stepsShowcase'>>(block)} />,
  trustBar: (block) => <TrustBar {...as<BlockOf<'trustBar'>>(block)} />,
  pricingCards: (block, locale) => <PricingCards {...as<BlockOf<'pricingCards'>>(block)} locale={locale} />,
  productShowcase: (block, locale) => <ProductShowcase {...as<BlockOf<'productShowcase'>>(block)} locale={locale} />,
  ladderSteps: (block) => <LadderSteps {...as<BlockOf<'ladderSteps'>>(block)} />,
}
