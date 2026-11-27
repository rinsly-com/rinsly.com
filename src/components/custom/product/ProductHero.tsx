import type { ReactNode } from 'react'

import type { Locale } from '@rinsly-com/site-core'
import { Eyebrow, Section } from '@rinsly-com/site-core/ui'

import type { ProductHeroBlock } from '@/payload-types'

import { BrowserFrame, CmsPhone, MiniBusinessSite, MiniEnvironments, MiniPlanDashboard, MiniStudioPortfolio } from './Frames'
import { ProductLink } from './ProductLink'

type Props = Omit<ProductHeroBlock, 'blockType'> & { locale: Locale }

type Showcase = NonNullable<ProductHeroBlock['showcase']>
const SCENES: Record<NonNullable<Showcase['kind']>, (showcase: Showcase) => ReactNode> = {
  business: () => <MiniBusinessSite />,
  plans: () => <MiniPlanDashboard />,
  studio: () => <MiniStudioPortfolio />,
  environments: (showcase) => <MiniEnvironments liveLabel={showcase.liveLabel} stagingLabel={showcase.stagingLabel} />,
}

/**
 * `productHero`: the first screen of a conversion page. Copy left (eyebrow,
 * H1, one-line sub, price chip, one primary button plus an optional text
 * link), example-site frame right.
 *
 * Motion: the heading and copy use the existing CSS hero entrance
 * (data-hero-title stays opaque, so the LCP heading paints from the server
 * HTML). The frames carry `data-assemble`; RinslyMotion moves them in after
 * first paint. The frame column has a fixed height in normal flow, so the
 * assembly cannot move anything (no CLS). Phones (< lg) do not get the frame
 * at all: the H1, chip, button and the next section (plans, ladder, doors)
 * are what fits the first screen there.
 */
export function ProductHero({ eyebrow, title, sub, priceChip, buttons, variant, showcase, locale }: Props) {
  const split = variant !== 'compact'
  const scene = SCENES[showcase?.kind ?? 'business'](showcase ?? {})
  const first = buttons?.at(0)
  const rest = buttons?.slice(1) ?? []
  return (
    <div data-hero className="relative">
      <Section className="pt-8 pb-5 sm:pt-8">
        <div className={split ? 'grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]' : 'max-w-3xl'}>
          <div className="flex flex-col items-start">
            {eyebrow && (
              <span data-hero-el style={{ animationDelay: '0.05s' }}>
                <Eyebrow>{eyebrow}</Eyebrow>
              </span>
            )}
            <h1
              data-hero-title
              className="mt-3 text-[clamp(32px,4.4vw,46px)] font-extrabold leading-[1.06] tracking-[-0.025em] text-ink"
            >
              {title}
            </h1>
            <p data-hero-el style={{ animationDelay: '0.14s' }} className="mt-3 max-w-[52ch] text-[17px] leading-relaxed text-muted">
              {sub}
            </p>
            {priceChip?.amount && (
              <p
                data-hero-el
                style={{ animationDelay: '0.2s' }}
                className="mt-4 inline-flex items-baseline gap-2 rounded-pill border border-accent/20 bg-accent-soft py-1.5 pr-3.5 pl-3"
              >
                <strong data-count className="inline-block min-w-[3ch] text-base font-extrabold tracking-[-0.02em] text-accent-strong tabular-nums">
                  {priceChip.amount}
                </strong>
                {priceChip.suffix && <span className="text-[13px] font-medium text-muted">{priceChip.suffix}</span>}
              </p>
            )}
            {first && (
              <div
                data-hero-el
                style={{ animationDelay: '0.28s' }}
                className="mt-6 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-5"
              >
                <ProductLink link={first} locale={locale} look={first.variant === 'secondary' ? 'text' : 'primary'} />
                {rest.map((button, i) => (
                  <ProductLink key={button.id ?? i} link={button} locale={locale} look="text" className="self-start sm:self-center" />
                ))}
              </div>
            )}
          </div>
          {split && (
            <figure className="relative hidden lg:block">
              <div className="relative h-[280px]">
                <div data-assemble="frame" className="relative h-full">
                  <BrowserFrame url={showcase?.url} className="h-full">
                    <div className="h-[240px]">
                      {scene}
                    </div>
                  </BrowserFrame>
                  {showcase?.badge && (
                    <p className="absolute bottom-6 left-5 z-[2] max-w-[calc(100%-40px)] rounded-pill bg-slate px-3 py-1.5 text-[12.5px] font-semibold text-slate-ink shadow-card">
                      {showcase.badge}
                    </p>
                  )}
                </div>
                {showcase?.showPhone && (
                  <div data-assemble="phone" className="absolute -right-1 bottom-2 z-[3]">
                    <div data-phone-float>
                      <CmsPhone saveLabel={showcase.saveLabel} />
                    </div>
                  </div>
                )}
              </div>
              {showcase?.caption && <figcaption className="mt-2 text-xs text-muted">{showcase.caption}</figcaption>}
            </figure>
          )}
        </div>
      </Section>
    </div>
  )
}
