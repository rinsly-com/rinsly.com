import type { Locale } from '@rinsly-com/site-core'
import { Section } from '@rinsly-com/site-core/ui'

import type { DoorCardsBlock } from '@/payload-types'

import { ProductLink } from './ProductLink'

type Props = Omit<DoorCardsBlock, 'blockType'> & { locale: Locale }

/** `doorCards`: the two home doors as equal offer cards (three bullets, price, one button each). */
export function DoorCards({ eyebrow, title, doors, locale }: Props) {
  if (!doors?.length) return null
  return (
    <Section className="pt-2 pb-12 sm:pb-16">
      {(eyebrow || title) && (
        <div data-reveal className="mb-6 flex flex-col gap-2">
          {eyebrow && <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>}
          {title && <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-[30px]">{title}</h2>}
        </div>
      )}
      <div data-reveal-group className="grid gap-4 md:grid-cols-2">
        {doors.map((door, i) => (
          <article key={door.id ?? i} className="flex flex-col rounded-2xl border border-hair bg-card p-6 shadow-card">
            {door.label && <p className="text-[11px] font-bold tracking-[0.14em] text-accent uppercase">{door.label}</p>}
            <h3 className="mt-1.5 text-lg font-bold tracking-[-0.01em] text-ink">{door.title}</h3>
            {door.price && (
              <p className="mt-3 flex items-baseline gap-2">
                <span data-count className="inline-block min-w-[3ch] text-[26px] font-extrabold tracking-[-0.03em] text-ink tabular-nums">
                  {door.price}
                </span>
                {door.priceNote && <span className="text-[13px] text-muted">{door.priceNote}</span>}
              </p>
            )}
            {door.howLine && <p className="mt-4 text-xs font-semibold text-ink">{door.howLine}</p>}
            {door.bullets?.length ? (
              <ul className="mt-2 flex flex-col gap-2">
                {door.bullets.map((bullet, j) => (
                  <li key={bullet.id ?? j} className="flex items-start gap-2.5 text-sm text-ink">
                    <span aria-hidden className="mt-[5px] block size-2.5 shrink-0 rounded-full border-2 border-accent" />
                    <span>{bullet.text}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-auto flex flex-col gap-3 pt-5">
              {door.finePrint && <p className="text-[13px] leading-relaxed text-muted">{door.finePrint}</p>}
              <ProductLink link={door.button} locale={locale} look={door.button.variant === 'secondary' ? 'outline' : 'primary'} className="w-full" />
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}
