import type { Locale } from '@rinsly-com/site-core'
import { Section } from '@rinsly-com/site-core/ui'

import type { ProductShowcaseBlock } from '@/payload-types'

import { BrowserFrame, MiniBusinessSite, StepCms } from './Frames'
import { ProductLink } from './ProductLink'

type Props = Omit<ProductShowcaseBlock, 'blockType'> & { locale: Locale }

/** `productShowcase`: short copy beside a browser frame (a price list, an example site or a CMS view). */
export function ProductShowcase({ eyebrow, title, sub, bullets, layout, frame, invoiceRows, button, locale }: Props) {
  const copyRight = layout === 'copyRight'
  return (
    <Section className="py-12 sm:py-16">
      <div data-reveal className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className={copyRight ? 'lg:order-2' : undefined}>
          {eyebrow && <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>}
          {title && <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-[30px]">{title}</h2>}
          {sub && <p className="mt-3 text-[15px] leading-relaxed text-muted">{sub}</p>}
          {bullets?.length ? (
            <ul className="mt-4 flex flex-col gap-2">
              {bullets.map((bullet, i) => (
                <li key={bullet.id ?? i} className="flex items-start gap-2.5 text-sm text-ink">
                  <span aria-hidden className="mt-[5px] block size-2.5 shrink-0 rounded-full border-2 border-accent" />
                  {bullet.text}
                </li>
              ))}
            </ul>
          ) : null}
          {button?.label && (
            <div className="mt-5">
              <ProductLink link={button} locale={locale} look={button.variant === 'secondary' ? 'text' : 'primary'} />
            </div>
          )}
        </div>
        <BrowserFrame url={frame?.url} className={copyRight ? 'lg:order-1' : undefined}>
          {frame?.kind === 'invoice' ? (
            <div className="bg-paper p-5">
              <div className="rounded-xl border border-hair bg-card p-4">
                {frame.title && <p className="mb-2 text-[13px] font-bold text-ink">{frame.title}</p>}
                <dl>
                  {invoiceRows?.map((row, i) => (
                    <div key={row.id ?? i} className="flex items-baseline justify-between gap-4 border-t border-hair py-2 text-sm first:border-t-0">
                      <dt className="text-muted">{row.label}</dt>
                      <dd className="font-bold text-ink tabular-nums">{row.amount}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ) : (
            <div className="h-[240px]">{frame?.kind === 'cms' ? <StepCms /> : <MiniBusinessSite />}</div>
          )}
        </BrowserFrame>
      </div>
    </Section>
  )
}
