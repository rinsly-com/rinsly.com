import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import { Buttons } from '@/components/frontend/ui/CMSLink'
import { Icon } from '@/components/frontend/ui/Icon'
import { OfferteForm } from '@/components/frontend/OfferteForm'
import { Section } from '@/components/frontend/ui/Section'
import { SectionHeading } from '@/components/frontend/ui/SectionHeading'

type Props = Extract<NonNullable<Page['layout']>[number], { blockType: 'contact' }> & {
  locale: Locale
}

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

/** Contact section: details (left) + an optional quote-request form (right). */
export function Contact({ header, items, buttons, showForm, locale }: Props) {
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

        {showForm !== false && <OfferteForm locale={locale} />}
      </div>
    </Section>
  )
}

export default Contact
