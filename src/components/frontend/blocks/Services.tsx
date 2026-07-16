import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import { Icon } from '@/components/frontend/ui/Icon'
import { Section } from '@/components/frontend/ui/Section'
import { SectionHeading } from '@/components/frontend/ui/SectionHeading'

type Props = Extract<NonNullable<Page['layout']>[number], { blockType: 'services' }> & {
  locale: Locale
}

/** Services section: a responsive grid of cards with checkmark feature lists. */
export function Services({ header, cards }: Props) {
  return (
    <Section className="py-16 sm:py-20">
      <SectionHeading header={header} />
      {cards?.length ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => (
            <article
              key={card.id ?? i}
              className="shadow-card flex flex-col rounded-2xl border border-hair bg-card p-6"
            >
              {card.icon && (
                <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon name={card.icon} fallback="IconPoint" size={22} stroke={1.75} />
                </span>
              )}
              <h3 className="text-lg font-bold tracking-[-0.01em] text-ink">{card.title}</h3>
              {card.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted">{card.description}</p>
              )}
              {card.features?.length ? (
                <ul className="mt-4 flex flex-col gap-2.5 border-t border-hair pt-4">
                  {card.features.map((f, j) => (
                    <li key={f.id ?? j} className="flex items-start gap-2.5 text-sm text-ink">
                      <span className="mt-0.5 font-extrabold text-good">✓</span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </Section>
  )
}

export default Services
