'use client'

import { useState } from 'react'
import { RichText } from '@payloadcms/richtext-lexical/react'

import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import { Section } from '@/components/frontend/ui/Section'
import { SectionHeading } from '@/components/frontend/ui/SectionHeading'

type Props = Extract<NonNullable<Page['layout']>[number], { blockType: 'accordion' }> & {
  locale: Locale
}

/**
 * Accordion / FAQ: one item open at a time, with a smooth height animation
 * (grid-template-rows 0fr↔1fr). Client component for the open/close state.
 */
export function Accordion({ header, items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  if (!items?.length) return null

  return (
    <Section className="py-16 sm:py-20">
      <SectionHeading header={header} align="center" className="mx-auto mb-10" />
      <div data-reveal-group className="mx-auto flex max-w-3xl flex-col gap-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <div
              key={item.id ?? index}
              className={[
                'shadow-card overflow-hidden rounded-xl border bg-card transition-colors',
                isOpen ? 'border-accent' : 'border-hair',
              ].join(' ')}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-semibold text-ink"
              >
                {item.title}
                <span
                  aria-hidden
                  className={[
                    'text-xl leading-none text-accent transition-transform duration-300',
                    isOpen ? 'rotate-45' : 'rotate-0',
                  ].join(' ')}
                >
                  +
                </span>
              </button>
              <div
                className={[
                  'grid transition-[grid-template-rows] duration-300 ease-out',
                  isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                ].join(' ')}
              >
                <div className="overflow-hidden">
                  {item.body && (
                    <div className="px-5 pb-5 text-sm leading-relaxed text-muted">
                      <RichText data={item.body} disableContainer />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

export default Accordion
