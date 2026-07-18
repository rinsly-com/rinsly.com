import React from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import { Section } from '@/components/frontend/ui/Section'
import { SectionHeading } from '@/components/frontend/ui/SectionHeading'

type Props = Extract<NonNullable<Page['layout']>[number], { blockType: 'richText' }> & {
  locale: Locale
}

/** Free-form rich text section with an optional heading, at reading or full width. */
export function RichTextBlock({ header, content, width }: Props) {
  const narrow = width !== 'wide'
  return (
    <Section className="py-14 sm:py-16">
      <div className={narrow ? 'mx-auto max-w-3xl' : ''}>
        <SectionHeading header={header} className="mb-6" />
        {content && (
          <div data-reveal className="rich-text">
            <RichText data={content} />
          </div>
        )}
      </div>
    </Section>
  )
}

export default RichTextBlock
