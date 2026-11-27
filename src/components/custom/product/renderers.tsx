import type { BlockRenderer } from '@rinsly-com/site-core'

import type { Page } from '@/payload-types'

import { DoorCards } from './DoorCards'
import { LadderSteps } from './LadderSteps'
import { PricingCards } from './PricingCards'
import { ProductHero } from './ProductHero'
import { ProductShowcase } from './ProductShowcase'
import { StepsShowcase } from './StepsShowcase'
import { TrustBar } from './TrustBar'

type BlockOf<T extends string> = Extract<NonNullable<Page['layout']>[number], { blockType: T }>

// The type parameter is how each call site names its block. The assertion is the use.
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
const as = <T,>(block: unknown): T => block as T

/**
 * Renderers for the product-led blocks (src/blocks/product), shared by the
 * server map (`@/blockRenderers`, the public site) and the client map
 * (`@/components/PreviewShell`, live preview).
 *
 * No `'use client'` here on purpose: this is a plain module, so each side
 * bundles its own copy of these functions (functions cannot cross the
 * server/client boundary). The components are plain, synchronous and
 * hook-free, so they render in both. One list means a new product block
 * cannot render on the site and be missing from live preview again.
 */
export const productRenderers: Record<string, BlockRenderer> = {
  productHero: (block, locale) => <ProductHero {...as<BlockOf<'productHero'>>(block)} locale={locale} />,
  doorCards: (block, locale) => <DoorCards {...as<BlockOf<'doorCards'>>(block)} locale={locale} />,
  stepsShowcase: (block) => <StepsShowcase {...as<BlockOf<'stepsShowcase'>>(block)} />,
  trustBar: (block) => <TrustBar {...as<BlockOf<'trustBar'>>(block)} />,
  pricingCards: (block, locale) => <PricingCards {...as<BlockOf<'pricingCards'>>(block)} locale={locale} />,
  productShowcase: (block, locale) => <ProductShowcase {...as<BlockOf<'productShowcase'>>(block)} locale={locale} />,
  ladderSteps: (block) => <LadderSteps {...as<BlockOf<'ladderSteps'>>(block)} />,
}
