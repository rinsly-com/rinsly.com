import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import { Buttons } from '@/components/frontend/ui/CMSLink'
import { Eyebrow } from '@/components/frontend/ui/Eyebrow'
import { Section } from '@/components/frontend/ui/Section'

type Props = Extract<NonNullable<Page['layout']>[number], { blockType: 'hero' }> & {
  locale: Locale
}

/**
 * Hero: eyebrow, large balanced title and a lede paragraph, with CTA buttons.
 * A soft accent glow sits behind it. Clears the fixed header via top padding.
 */
export function Hero({ header, buttons, locale }: Props) {
  return (
    <div data-hero className="relative overflow-hidden">
      {/* Decorative accent glow. */}
      <div
        aria-hidden
        data-hero-glow
        className="pointer-events-none absolute -top-40 left-1/2 h-[460px] w-[820px] -translate-x-1/2 rounded-full bg-accent/15 blur-[130px]"
      />
      <Section className="relative pt-36 pb-14 sm:pt-44 sm:pb-20">
        <div className="flex max-w-3xl flex-col items-start gap-6">
          {header?.eyebrow && (
            <span data-hero-el style={{ animationDelay: '0.05s' }}>
              <Eyebrow>{header.eyebrow}</Eyebrow>
            </span>
          )}
          {header?.title && (
            <h1
              data-hero-title
              className="text-[clamp(32px,6vw,52px)] font-extrabold leading-[1.05] tracking-[-0.025em] text-ink"
            >
              {header.title}
            </h1>
          )}
          {header?.intro && (
            <p
              data-hero-el
              style={{ animationDelay: '0.18s' }}
              className="max-w-[60ch] text-[17px] leading-relaxed text-muted"
            >
              {header.intro}
            </p>
          )}
          {buttons?.length ? (
            <div data-hero-el style={{ animationDelay: '0.28s' }}>
              <Buttons
                buttons={buttons}
                locale={locale}
                className="flex flex-wrap items-center gap-5"
              />
            </div>
          ) : null}
        </div>
      </Section>
    </div>
  )
}

export default Hero
