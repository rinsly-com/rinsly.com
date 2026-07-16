import React from 'react'

import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import { Buttons } from '@/components/frontend/ui/CMSLink'
import { Section } from '@/components/frontend/ui/Section'

type Props = Extract<NonNullable<Page['layout']>[number], { blockType: 'buttonRow' }> & {
  locale: Locale
}

const ALIGN: Record<string, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

/** A standalone row of 0…N CMS-configured buttons. */
export function ButtonRow({ buttons, alignment, locale }: Props) {
  if (!buttons?.length) return null

  return (
    <Section className="py-8 sm:py-10">
      <Buttons
        buttons={buttons}
        locale={locale}
        className={`flex flex-wrap items-center gap-5 ${ALIGN[alignment ?? 'left']}`}
      />
    </Section>
  )
}

export default ButtonRow
