import { Section } from '@rinsly-com/site-core/ui'

import type { TrustBarBlock } from '@/payload-types'

type Props = Omit<TrustBarBlock, 'blockType'>

/** `trustBar`: three or four short lines in one quiet row. Wraps, never scrolls sideways. */
export function TrustBar({ items }: Props) {
  if (!items?.length) return null
  return (
    <Section className="py-4 sm:py-6">
      <ul data-reveal-group className="flex flex-wrap gap-x-8 gap-y-2.5 border-y border-hair py-4">
        {items.map((item, i) => (
          <li key={item.id ?? i} className="flex items-center gap-2 text-sm text-muted">
            <span aria-hidden className="block size-1.5 shrink-0 rounded-full bg-accent" />
            {item.text}
          </li>
        ))}
      </ul>
    </Section>
  )
}
