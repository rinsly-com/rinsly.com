import type { Page } from '@/payload-types'
import type { Locale } from '@rinsly-com/site-core'
import { Section, SectionHeading, Buttons, Icon } from '@rinsly-com/site-core/ui'

import { OfferteForm } from '@/components/OfferteForm'

/**
 * Rinsly's custom `contact` renderer — the engine's core contact block shows
 * details only; here we override it (via `extraRenderers`) to add the quote-
 * request wizard (OfferteForm) on the right, matching the original layout.
 */
type ContactBlock = Extract<NonNullable<Page['layout']>[number], { blockType: 'contact' }>
type Props = ContactBlock & { locale: Locale }

type Item = NonNullable<Props['items']>[number]

const ICON: Record<string, string> = {
  email: 'IconMail',
  phone: 'IconPhone',
  address: 'IconMapPin',
  text: 'IconPoint',
}

function hrefFor(item: Item): string | undefined {
  if (item.kind === 'email') return `mailto:${item.value}`
  if (item.kind === 'phone') return `tel:${item.value?.replace(/\s+/g, '')}`
  return undefined
}

export function Contact({ header, items, buttons, locale }: Props) {
  return (
    <Section className="py-16 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <SectionHeading header={header} />
          {items?.length ? (
            <ul data-reveal-group className="flex flex-col gap-4">
              {items.map((item, i) => {
                const href = hrefFor(item)
                const body = (
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Icon name={ICON[item.kind ?? 'text']} fallback="IconPoint" size={18} stroke={1.75} />
                    </span>
                    <span className="flex flex-col">
                      {item.label && (
                        <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
                          {item.label}
                        </span>
                      )}
                      <span className="text-[15px] font-semibold text-ink">{item.value}</span>
                    </span>
                  </span>
                )
                return (
                  <li key={item.id ?? i}>
                    {href ? (
                      <a href={href} className="transition-opacity hover:opacity-80">
                        {body}
                      </a>
                    ) : (
                      body
                    )}
                  </li>
                )
              })}
            </ul>
          ) : null}
          {buttons?.length ? (
            <Buttons buttons={buttons} locale={locale} className="mt-2 flex flex-wrap items-center gap-5" />
          ) : null}
        </div>

        <OfferteForm locale={locale} />
      </div>
    </Section>
  )
}

export default Contact
