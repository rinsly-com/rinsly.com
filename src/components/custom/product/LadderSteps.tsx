import { Section } from '@rinsly-com/site-core/ui'

import type { LadderStepsBlock } from '@/payload-types'

type Props = Omit<LadderStepsBlock, 'blockType'>

/**
 * `ladderSteps`: the partner ladder (terms v3.3 art. 5) as equal rungs, the
 * first one marked as the base. The footnote carries the legal precision
 * (grondslag, the 35% maximum as the sum of the rungs), never a heading.
 */
export function LadderSteps({ eyebrow, title, intro, rungs, footnote }: Props) {
  if (!rungs?.length) return null
  return (
    <Section className="pt-2 pb-12 sm:pb-16">
      {(eyebrow || title || intro) && (
        <div data-reveal className="mb-5 flex max-w-2xl flex-col gap-2">
          {eyebrow && <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>}
          {title && <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-[30px]">{title}</h2>}
          {intro && <p className="text-[15px] leading-relaxed text-muted">{intro}</p>}
        </div>
      )}
      <ol data-reveal-group className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rungs.map((rung, i) => (
          <li
            key={rung.id ?? i}
            className={['flex flex-col rounded-2xl border bg-card p-4 shadow-card', i === 0 ? 'border-accent ring-1 ring-accent' : 'border-hair'].join(' ')}
          >
            <p className="text-[11px] font-bold tracking-[0.14em] text-accent uppercase">{rung.name}</p>
            <p data-count className="mt-1 text-[28px] font-extrabold tracking-[-0.03em] text-accent-strong tabular-nums">
              {rung.percent}
            </p>
            {rung.text && <p className="mt-1 text-[13px] leading-snug text-muted">{rung.text}</p>}
          </li>
        ))}
      </ol>
      {footnote && <p className="mt-4 max-w-[80ch] text-sm leading-[1.65] text-muted">{footnote}</p>}
    </Section>
  )
}
