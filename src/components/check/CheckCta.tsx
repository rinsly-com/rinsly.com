import { ArrowIcon } from '@rinsly-com/site-core/ui'

import { checkConfig } from '@/check.config'

/**
 * Slate conversion banner for the /check funnel — same visual language as the
 * homepage "Klaar om online te gaan?" band (see site-core's Cta block). One
 * action: book the free intro call. Falls back to a prefilled mailto: while no
 * booking link is configured (check.config.ts), plus an optional phone line.
 */
export function CheckCta({ subject }: { subject: string }) {
  const bookingHref =
    checkConfig.bookingUrl ||
    `mailto:${checkConfig.email}?subject=${encodeURIComponent(subject)}`
  const external = bookingHref.startsWith('http')

  return (
    <section id="kennismaking" className="mx-auto w-full max-w-[1080px] px-5 py-12 sm:px-8 sm:py-16">
      <div
        data-reveal
        className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-slate px-7 py-8 text-slate-ink sm:flex-row sm:items-center"
      >
        <div
          aria-hidden
          data-parallax="0.25"
          className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-accent/25 blur-[90px]"
        />
        <div className="relative flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
            Kennismaking
          </span>
          <h2 className="text-xl font-bold tracking-[-0.01em] sm:text-2xl">
            Klaar voor een site die wél klanten oplevert?
          </h2>
          <p className="max-w-[52ch] text-sm text-slate-ink/70">
            15 minuten, gratis en vrijblijvend. U hoort direct wat er mogelijk is — beslissen kan
            altijd later.
          </p>
        </div>
        <div className="relative flex shrink-0 flex-col items-start gap-3 sm:items-end">
          <a
            href={bookingHref}
            data-magnetic=""
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Plan een gratis kennismaking
            <ArrowIcon />
          </a>
          {checkConfig.phone && (
            <a
              href={`tel:${checkConfig.phone.replace(/[^+\d]/g, '')}`}
              className="text-sm font-semibold text-slate-ink hover:underline"
            >
              Liever bellen? {checkConfig.phone}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}
