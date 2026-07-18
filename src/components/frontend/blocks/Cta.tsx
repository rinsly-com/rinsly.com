import type { Page } from '@/payload-types'
import type { Locale } from '@/lib/locale'
import { CMSLink } from '@/components/frontend/ui/CMSLink'
import { Section } from '@/components/frontend/ui/Section'

type Props = Extract<NonNullable<Page['layout']>[number], { blockType: 'cta' }> & {
  locale: Locale
}

/** Slate call-to-action band with a soft accent bloom. */
export function Cta({ eyebrow, title, text, button, locale }: Props) {
  return (
    <Section className="py-12 sm:py-16">
      <div
        data-reveal
        className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-slate px-7 py-8 text-slate-ink sm:flex-row sm:items-center"
      >
        {/* Accent bloom, top-right. */}
        <div
          aria-hidden
          data-parallax="0.25"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/25 blur-[90px]"
        />
        <div className="relative flex flex-col gap-1.5">
          {eyebrow && (
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent">{eyebrow}</span>
          )}
          <h2 className="text-xl font-bold tracking-[-0.01em] sm:text-2xl">{title}</h2>
          {text && <p className="max-w-[52ch] text-sm text-slate-ink/70">{text}</p>}
        </div>
        {button?.label && (
          <div className="relative shrink-0">
            <CMSLink link={button} locale={locale} />
          </div>
        )}
      </div>
    </Section>
  )
}

export default Cta
