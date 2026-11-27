import { Section } from '@rinsly-com/site-core/ui'

import type { StepsShowcaseBlock } from '@/payload-types'

import { StepCms, StepLive, StepWireframe } from './Frames'

type Props = Omit<StepsShowcaseBlock, 'blockType'>

const FRAMES = { wireframe: StepWireframe, live: StepLive, cms: StepCms } as const

/**
 * `stepsShowcase`: three steps, each with a small frame. Steps 2 and 3 carry
 * a wireframe overlay (`data-morph-overlay`) that RinslyMotion fades out once,
 * on enter (data-frame-morph). Without motion the overlay is never shown: the
 * final frame is what you see. The overlay sits absolutely inside a fixed
 * 120px frame, so the fade cannot move anything.
 */
export function StepsShowcase({ eyebrow, title, intro, steps }: Props) {
  if (!steps?.length) return null
  return (
    <Section className="py-12 sm:py-16">
      {(eyebrow || title || intro) && (
        <div data-reveal className="mb-7 flex max-w-2xl flex-col gap-2">
          {eyebrow && <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">{eyebrow}</p>}
          {title && <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-[30px] sm:leading-[1.15]">{title}</h2>}
          {intro && <p className="text-[15px] leading-relaxed text-muted">{intro}</p>}
        </div>
      )}
      <div data-reveal-group data-frame-morph className="grid gap-4 md:grid-cols-3">
        {steps.map((step, i) => {
          const Frame = FRAMES[step.frameKind]
          return (
            <article key={step.id ?? i} className="overflow-hidden rounded-2xl border border-hair bg-card shadow-card">
              <div className="relative h-[120px] border-b border-hair bg-paper">
                <Frame />
                {step.frameKind !== 'wireframe' && (
                  <div data-morph-overlay className="absolute inset-0 bg-paper">
                    <StepWireframe />
                  </div>
                )}
              </div>
              <div className="p-5">
                {step.label && <p className="text-[11px] font-bold tracking-[0.14em] text-accent uppercase">{step.label}</p>}
                <h3 className="mt-1 text-[15px] font-bold text-ink">{step.title}</h3>
                {step.text && <p className="mt-1.5 text-sm leading-relaxed text-muted">{step.text}</p>}
              </div>
            </article>
          )
        })}
      </div>
    </Section>
  )
}
