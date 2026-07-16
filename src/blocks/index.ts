import type { Block } from 'payload'

import { heroBlock } from './hero'
import { servicesBlock } from './services'
import { pricingBlock } from './pricing'
import { ctaBlock } from './cta'
import { contactBlock } from './contact'
import { accordionBlock } from './accordion'
import { buttonRowBlock } from './buttonRow'
import { richTextBlock } from './richText'
import { noteBlock } from './note'

export const pageBlocks: Block[] = [
  heroBlock,
  servicesBlock,
  pricingBlock,
  ctaBlock,
  contactBlock,
  accordionBlock,
  buttonRowBlock,
  richTextBlock,
  noteBlock,
]
