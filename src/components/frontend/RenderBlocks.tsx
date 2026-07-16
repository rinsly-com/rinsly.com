import React from 'react'

import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'

import { Accordion } from '@/components/frontend/blocks/Accordion'
import { ButtonRow } from '@/components/frontend/blocks/ButtonRow'
import { Contact } from '@/components/frontend/blocks/Contact'
import { Cta } from '@/components/frontend/blocks/Cta'
import { Hero } from '@/components/frontend/blocks/Hero'
import { Note } from '@/components/frontend/blocks/Note'
import { Pricing } from '@/components/frontend/blocks/Pricing'
import { RichTextBlock } from '@/components/frontend/blocks/RichTextBlock'
import { Services } from '@/components/frontend/blocks/Services'

type Block = NonNullable<Page['layout']>[number]

/**
 * Typed block dispatcher: maps each Payload block slug to its section
 * component. Unknown block types render nothing (forward compatible). `locale`
 * is threaded through so internal links resolve to the active language.
 */
function RenderBlock({ block, locale }: { block: Block; locale: Locale }) {
  switch (block.blockType) {
    case 'hero':
      return <Hero {...block} locale={locale} />
    case 'services':
      return <Services {...block} locale={locale} />
    case 'pricing':
      return <Pricing {...block} locale={locale} />
    case 'cta':
      return <Cta {...block} locale={locale} />
    case 'contact':
      return <Contact {...block} locale={locale} />
    case 'note':
      return <Note {...block} locale={locale} />
    case 'accordion':
      return <Accordion {...block} locale={locale} />
    case 'buttonRow':
      return <ButtonRow {...block} locale={locale} />
    case 'richText':
      return <RichTextBlock {...block} locale={locale} />
    default:
      return null
  }
}

export function RenderBlocks({ layout, locale }: { layout: Page['layout']; locale: Locale }) {
  if (!layout || layout.length === 0) return null

  return (
    <>
      {layout.map((block, index) => {
        const key = block.id ?? `${block.blockType}-${index}`
        // Every block is a potential scroll target: prefer its readable Anchor
        // ID, fall back to the stable block id.
        const id = block.anchor?.trim().replace(/^#+/, '') || block.id || undefined
        if (!id) return <RenderBlock key={key} block={block} locale={locale} />
        // scroll-mt lands the section top ~10vh below the viewport top (clears
        // the sticky header) for both the smooth-scroll JS and native #hash links.
        return (
          <div key={key} id={id} className="scroll-mt-[10vh]">
            <RenderBlock block={block} locale={locale} />
          </div>
        )
      })}
    </>
  )
}

export default RenderBlocks
