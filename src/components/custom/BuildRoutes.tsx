import type { Locale } from '@rinsly-com/site-core'
import { Section, SectionHeading } from '@rinsly-com/site-core/ui'

import type { BuildRoutesBlock } from '@/payload-types'

/**
 * The two build routes. The lead route is first and visually dominant; the
 * alternative is a quieter line underneath. Copy and figures come from the
 * CMS block, so this component only decides the hierarchy.
 */
type Props = BuildRoutesBlock & { locale: Locale }

export function BuildRoutes({
  eyebrow,
  title,
  intro,
  primaryLabel,
  primaryPrice,
  primaryTerm,
  alternativeKicker,
  alternativeLabel,
  alternativePrice,
  alternativeTerm,
  footnote,
}: Props) {
  const hasPrimary = Boolean(primaryLabel || primaryPrice || primaryTerm)
  const hasAlternative = Boolean(alternativeLabel || alternativePrice || alternativeTerm)

  return (
    <Section className="pb-6 pt-2 sm:pb-10">
      {(eyebrow || title || intro) && <SectionHeading header={{ eyebrow, title, intro }} />}

      <div className={eyebrow || title || intro ? 'mt-8 flex flex-col gap-3' : 'flex flex-col gap-3'}>
        {hasPrimary && (
          <article
            data-build-route="primary"
            className="rounded-2xl border-2 border-accent bg-accent/8 px-6 py-7 shadow-card sm:px-10 sm:py-9"
          >
            {primaryLabel && (
              <h3 className="text-xs font-bold uppercase tracking-[0.1em] text-accent">{primaryLabel}</h3>
            )}
            {primaryPrice && (
              <p className="mt-2 text-5xl font-extrabold leading-none tabular-nums tracking-[-0.03em] text-ink sm:text-6xl">
                {primaryPrice}
              </p>
            )}
            {primaryTerm && (
              <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-ink sm:text-lg">{primaryTerm}</p>
            )}
          </article>
        )}

        {hasAlternative && (
          <article
            data-build-route="alternative"
            className="rounded-2xl border border-hair bg-paper px-5 py-4 sm:px-6 sm:py-5"
          >
            {alternativeKicker && (
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">{alternativeKicker}</p>
            )}
            <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-muted">
              {alternativeLabel && <span className="font-semibold text-ink">{alternativeLabel}</span>}
              {alternativePrice && (
                <>
                  {alternativeLabel ? ', ' : null}
                  <span className="font-semibold tabular-nums text-ink">{alternativePrice}</span>
                </>
              )}
              {alternativeTerm && (
                <>
                  {alternativeLabel || alternativePrice ? ', ' : null}
                  {alternativeTerm}
                </>
              )}
            </p>
          </article>
        )}
      </div>

      {footnote && <p className="mt-4 max-w-[70ch] text-xs leading-relaxed text-muted">{footnote}</p>}
    </Section>
  )
}
