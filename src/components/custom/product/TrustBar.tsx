import { Section } from '@rinsly-com/site-core/ui'

import type { TrustBarBlock } from '@/payload-types'

type Props = Omit<TrustBarBlock, 'blockType'>

/** `trustBar`: three or four short lines in one quiet row. Wraps, never scrolls sideways. */
export function TrustBar({ items }: Props) {
  if (!items?.length) return null
  return (
    <Section className="py-4 sm:py-6">
      <ul data-reveal-group className="flex flex-wrap justify-between gap-x-6 gap-y-2.5 py-2">
        {items.map((item, i) => (
          <li key={item.id ?? i} className="flex items-center gap-2 text-[13px] text-muted">
            <span aria-hidden className="block size-1.5 shrink-0 rounded-full bg-accent" />
            {item.text}
          </li>
        ))}
      </ul>
    </Section>
  )
}
