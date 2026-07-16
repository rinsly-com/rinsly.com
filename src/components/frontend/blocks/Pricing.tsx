import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import { Section } from '@/components/frontend/ui/Section'
import { SectionHeading } from '@/components/frontend/ui/SectionHeading'

type Props = Extract<NonNullable<Page['layout']>[number], { blockType: 'pricing' }> & {
  locale: Locale
}

/**
 * Pricing tiers — the proposal's `.tiers` cards, incl. a highlighted tier.
 * With 4+ tiers the last one becomes a full-width banner card (header left,
 * features in columns on the right) so the grid stays three columns.
 */
export function Pricing({ header, tiers }: Props) {
  return (
    <Section className="py-16 sm:py-20">
      <SectionHeading header={header} />
      {tiers?.length ? (
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier, i) => {
            const highlight = Boolean(tier.recommended)
            const wide = tiers.length >= 4 && i === tiers.length - 1
            return (
              <article
                key={tier.id ?? i}
                className={[
                  'shadow-card relative rounded-2xl border bg-card p-6',
                  highlight ? 'border-accent ring-1 ring-accent' : 'border-hair',
                  wide ? 'md:col-span-2 lg:col-span-3' : 'flex flex-col',
                ].join(' ')}
              >
                {highlight && tier.badge && (
                  <span className="absolute -top-3 left-6 rounded-pill bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                    {tier.badge}
                  </span>
                )}
                <div className={wide ? 'flex flex-col gap-5 lg:flex-row lg:items-center' : 'flex grow flex-col'}>
                  <div className={wide ? 'lg:w-72 lg:shrink-0' : ''}>
                    <h3 className="text-lg font-bold tracking-[-0.01em] text-ink">{tier.name}</h3>
                    {tier.for && (
                      <p className={['mt-1 text-sm text-muted', wide ? '' : 'min-h-10'].join(' ')}>
                        {tier.for}
                      </p>
                    )}
                    <div className="mt-4 flex items-baseline gap-1">
                      {tier.price && (
                        <span className="text-[38px] font-extrabold tracking-[-0.03em] tabular-nums text-ink">
                          {tier.price}
                        </span>
                      )}
                      {tier.per && <span className="text-sm font-medium text-muted">{tier.per}</span>}
                    </div>
                    {tier.priceNote && <p className="mt-0.5 text-[13px] text-muted">{tier.priceNote}</p>}
                  </div>
                  {tier.features?.length ? (
                    <ul
                      className={
                        wide
                          ? 'grid gap-2.5 border-t border-hair pt-5 sm:grid-cols-2 lg:flex-1 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0'
                          : 'mt-5 flex flex-col gap-2.5 border-t border-hair pt-5'
                      }
                    >
                      {tier.features.map((f, j) => {
                        const included = f.included !== false
                        return (
                          <li
                            key={f.id ?? j}
                            className={[
                              'flex items-start gap-2.5 text-sm',
                              included ? 'text-ink' : 'text-muted',
                            ].join(' ')}
                          >
                            <span
                              className={included ? 'mt-0.5 font-extrabold text-good' : 'mt-0.5 text-muted'}
                            >
                              {included ? '✓' : '–'}
                            </span>
                            <span>{f.text}</span>
                          </li>
                        )
                      })}
                    </ul>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      ) : null}
    </Section>
  )
}

export default Pricing
