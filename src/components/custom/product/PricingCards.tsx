import type { Locale } from '@rinsly-com/site-core'
import { Section } from '@rinsly-com/site-core/ui'

import type { PricingCardsBlock } from '@/payload-types'

import { ProductLink } from './ProductLink'

type Props = Omit<PricingCardsBlock, 'blockType'> & { locale: Locale }

/**
 * `pricingCards`: the live plans side by side, each with its own button
 * (the core `pricing` block has none). The recommended plan is isolated with
 * a solid accent tag and ring (Von Restorff, UX falsification 27 Nov). Four
 * equal columns from lg, one column on phones.
 */
export function PricingCards({ eyebrow, title, plans, sharedLine, limitsNote, locale }: Props) {
  if (!plans?.length) return null
  return (
    <Section className="pt-0 pb-12 sm:pb-16">
      {(eyebrow || title) && (
        <div data-reveal className="mb-6 flex flex-col gap-2">
          {eyebrow && <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>}
          {title && <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-[30px]">{title}</h2>}
        </div>
      )}
      <div data-reveal-group className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan, i) => (
          <article
            key={plan.id ?? i}
            className={[
              'flex flex-col rounded-2xl border bg-card p-3.5 shadow-card',
              plan.featured ? 'border-accent ring-2 ring-accent' : 'border-hair',
            ].join(' ')}
          >
            {plan.tag && (
              // Full-width bar on the recommended plan (v5 mockup); white on accent is 4.9:1.
              <p className="mb-2 rounded-pill bg-accent px-3 py-1 text-[11px] font-bold tracking-[0.08em] text-accent-ink uppercase">
                {plan.tag}
              </p>
            )}
            <h3 className="text-[17px] font-bold tracking-[-0.01em] text-ink">{plan.title}</h3>
            {plan.tagline && <p className="mt-0.5 text-[13px] leading-snug text-muted">{plan.tagline}</p>}
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1">
              <span data-count className="text-[24px] font-extrabold tracking-[-0.03em] text-ink tabular-nums">
                {plan.price}
              </span>
              {plan.period && <span className="text-[13px] font-medium text-muted">{plan.period}</span>}
            </p>
            {plan.priceNote && <p className="text-[12.5px] text-muted">{plan.priceNote}</p>}
            {plan.features?.length ? (
              <ul className="mt-2 flex flex-col gap-[3px] border-t border-hair pt-2">
                {plan.features.map((feature, j) => {
                  const included = feature.included !== false
                  return (
                    <li key={feature.id ?? j} className={['flex items-start gap-2 text-[12.5px] leading-[1.35]', included ? 'text-ink' : 'text-muted'].join(' ')}>
                      <span
                        aria-hidden
                        className={['mt-[3px] block size-2.5 shrink-0 rounded-full border-2', included ? 'border-accent' : 'border-hair'].join(' ')}
                      />
                      <span>
                        {feature.text}
                        {!included && <span className="sr-only"> ({locale === 'nl' ? 'niet inbegrepen' : 'not included'})</span>}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : null}
            <div className="mt-auto pt-3">
              <ProductLink link={plan.button} locale={locale} look={plan.featured ? 'primary' : 'outline'} className="w-full" />
            </div>
          </article>
        ))}
      </div>
      {sharedLine && <p className="mt-3 text-sm font-semibold text-ink">{sharedLine}</p>}
      {limitsNote && <p className="mt-1.5 max-w-[80ch] text-[13px] leading-relaxed text-muted">{limitsNote}</p>}
    </Section>
  )
}
