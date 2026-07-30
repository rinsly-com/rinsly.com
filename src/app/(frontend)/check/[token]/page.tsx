import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { ArrowIcon, Eyebrow, Icon, Section, SectionHeading } from '@rinsly-com/site-core/ui'

import { checkConfig } from '@/check.config'
import { CheckCta } from '@/components/check/CheckCta'
import { GRADE_LABELS, getScorecard, gradeTone, type GradeKey } from '@/lib/leadlens'

/**
 * Personal scorecard page behind the CTA in LeadLens' scorecard e-mail:
 * "we bekeken uw site → dit is er concreet mis → zo lossen we het op → boek een
 * kennismaking". Renders live from the leadlens-checks R2 bucket; unknown or
 * expired tokens land on the generic /check page with a notice. Not part of the
 * static export (stashed by build-static.mjs) — this route needs the runtime.
 */
export const dynamic = 'force-dynamic'

const STEPS = [
  {
    icon: 'IconMessageCircle',
    title: 'Kennismaking',
    text: '15 minuten, gratis en vrijblijvend. We lopen de bevindingen door en u vertelt wat uw bedrijf nodig heeft.',
  },
  {
    icon: 'IconBrush',
    title: 'Ontwerp & bouw',
    text: 'Wij ontwerpen en bouwen uw nieuwe site. U levert alleen teksten en foto’s aan. De rest doen wij.',
  },
  {
    icon: 'IconRocket',
    title: 'Live & volledig beheerd',
    text: 'Uw site gaat live en blijft snel, veilig en up-to-date. Eén vast bedrag per maand, alles inbegrepen.',
  },
] as const

/** Findings arrive lowercase from LeadLens; only the first letter is presentation. */
const sentence = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Traffic-light pills: green ≥65, orange 40–64, red <40. Soft treatments
// (tinted bg + toned text) rather than solid fills — the tokens keep WCAG
// contrast in both color schemes where solid fills with white text don't.
// NOTE: diverges from the original mail spec (blue/grey mids and lows) — the
// scorecard e-mail should adopt the same traffic-light colors.
const PILL_TONES: Record<ReturnType<typeof gradeTone>, string> = {
  good: 'bg-good/15 text-good',
  mid: 'bg-warn/15 text-warn',
  low: 'bg-bad/15 text-bad',
}

type Params = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { token } = await params
  const result = await getScorecard(token)
  if (result.status !== 'ok') return { robots: { index: false, follow: false } }
  return {
    title: `Zo scoort ${result.scorecard.domain} | Rinsly`,
    robots: { index: false, follow: false },
  }
}

export default async function CheckTokenPage({ params }: Params) {
  const { token } = await params
  const result = await getScorecard(token)
  if (result.status !== 'ok') redirect('/check?link=verlopen')

  const { scorecard, screenshots } = result

  // v1 pageview signal for sales ("lead heeft gekeken") — a structured log line
  // in the Worker's logs, per handoff §6.4. No third-party analytics (§4).
  console.log(
    JSON.stringify({
      event: 'leadlens_check_view',
      token,
      domain: scorecard.domain,
      at: new Date().toISOString(),
    }),
  )

  const highlight = scorecard.findings[0] ?? scorecard.pitch
  const hasScreenshots = screenshots.desktop || screenshots.mobile

  return (
    <>
      {/* Hero — mirrors the homepage hero (accent glow, dark heading). */}
      <div data-hero className="relative overflow-hidden">
        <div
          aria-hidden
          data-hero-glow
          className="pointer-events-none absolute -top-40 left-1/2 h-[460px] w-[820px] -translate-x-1/2 rounded-full bg-accent/15 blur-[130px]"
        />
        <Section className="relative pt-32 pb-10 sm:pt-40 sm:pb-14">
          <div className="flex max-w-3xl flex-col items-start gap-6">
            <span data-hero-el style={{ animationDelay: '0.05s' }}>
              <Eyebrow>Gratis websitecheck</Eyebrow>
            </span>
            <h1
              data-hero-title
              className="text-[clamp(32px,6vw,52px)] font-extrabold leading-[1.05] tracking-[-0.025em] text-ink"
            >
              Zo scoort <span className="text-accent">{scorecard.domain}</span>
            </h1>
            {highlight && (
              <p
                data-hero-el
                style={{ animationDelay: '0.18s' }}
                className="max-w-[60ch] text-[17px] leading-relaxed text-muted"
              >
                {sentence(highlight)}
              </p>
            )}
            <div
              data-hero-el
              style={{ animationDelay: '0.28s' }}
              className="flex flex-wrap items-center gap-5"
            >
              <a
                href="#kennismaking"
                data-magnetic=""
                className="inline-flex items-center gap-2 rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Plan een gratis kennismaking
              </a>
              <Link
                href="/check"
                className="inline-flex items-center gap-2 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
              >
                Nieuwe scan
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </Section>
      </div>

      {/* Report grades — the e-mail's score pills, as cards. */}
      <Section className="py-10 sm:py-14">
        <SectionHeading
          header={{
            eyebrow: 'Rapport',
            title: `De cijfers van ${scorecard.businessName}`,
            intro: 'Vijf onderdelen, beoordeeld van 0 tot 100, hoger is beter.',
          }}
        />
        <div data-reveal-group className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(Object.keys(GRADE_LABELS) as GradeKey[]).map((key) => {
            const score = scorecard.grades[key]
            return (
              <div
                key={key}
                className="shadow-card flex flex-col items-center gap-3 rounded-2xl border border-hair bg-card p-5"
              >
                <span
                  className={`inline-flex min-w-16 items-center justify-center rounded-pill px-4 py-1.5 text-xl font-extrabold ${PILL_TONES[gradeTone(score)]}`}
                >
                  {score}
                </span>
                <span className="text-sm font-semibold text-ink">{GRADE_LABELS[key]}</span>
              </div>
            )
          })}
        </div>
      </Section>

      {/* Findings — the concrete observations, ready-made in Dutch. */}
      {scorecard.findings.length > 0 && (
        <Section className="py-6 sm:py-8">
          <div data-reveal className="shadow-card rounded-2xl border border-hair bg-card p-6 sm:p-8">
            <SectionHeading
              header={{ eyebrow: 'Bevindingen', title: 'Wat we concreet zagen' }}
            />
            <ul className="mt-6 flex flex-col gap-3">
              {scorecard.findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[15px] text-ink">
                  <span className="mt-0.5 font-extrabold text-good">✓</span>
                  <span>{sentence(finding)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* Screenshots — omitted per image when LeadLens didn't upload one. */}
      {hasScreenshots && (
        <Section className="py-10 sm:py-14">
          <SectionHeading
            header={{ eyebrow: 'Momentopname', title: 'Zo ziet uw site er nu uit' }}
          />
          <div data-reveal-group className="mt-8 grid items-start gap-4 sm:grid-cols-[5fr_2fr]">
            {screenshots.desktop && (
              <figure className="shadow-card overflow-hidden rounded-2xl border border-hair bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element -- streamed from R2 by our own route; the Next optimizer can't reach it */}
                <img
                  src={`/check/${token}/screenshot/desktop`}
                  alt={`Schermafbeelding van ${scorecard.domain} op een desktop`}
                  width={1440}
                  height={900}
                  loading="lazy"
                  className="aspect-[16/10] w-full object-cover object-top"
                />
                <figcaption className="border-t border-hair px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  Desktop
                </figcaption>
              </figure>
            )}
            {screenshots.mobile && (
              <figure className="shadow-card max-w-60 overflow-hidden rounded-2xl border border-hair bg-card sm:max-w-none">
                {/* eslint-disable-next-line @next/next/no-img-element -- streamed from R2 by our own route; the Next optimizer can't reach it */}
                <img
                  src={`/check/${token}/screenshot/mobile`}
                  alt={`Schermafbeelding van ${scorecard.domain} op een telefoon`}
                  width={390}
                  height={624}
                  loading="lazy"
                  className="aspect-[390/624] w-full object-cover object-top"
                />
                <figcaption className="border-t border-hair px-4 py-2.5 text-xs font-bold uppercase tracking-[0.08em] text-muted">
                  Mobiel
                </figcaption>
              </figure>
            )}
          </div>
        </Section>
      )}

      {/* The fix — three steps, homepage card style. */}
      <Section className="py-10 sm:py-14">
        <SectionHeading
          header={{
            eyebrow: 'Zo lossen we het op',
            title: 'Van verouderd naar verzorgd, in drie stappen',
          }}
        />
        <div data-reveal-group className="mt-10 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <article
              key={step.title}
              className="shadow-card flex flex-col rounded-2xl border border-hair bg-card p-6"
            >
              <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                <Icon name={step.icon} fallback="IconPoint" size={22} stroke={1.75} />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
                Stap {i + 1}
              </span>
              <h3 className="mt-1 text-lg font-bold tracking-[-0.01em] text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
            </article>
          ))}
        </div>
      </Section>

      {/* Transparent price indication (conversion requirement, handoff §2.6). */}
      <Section className="py-6 sm:py-8">
        <div data-reveal className="shadow-card rounded-2xl border border-hair bg-card p-6 sm:p-8">
          <SectionHeading
            header={{ eyebrow: 'Prijsindicatie', title: checkConfig.pricing.title }}
          />
          <ul className="mt-6 flex flex-col gap-3">
            {checkConfig.pricing.lines.map((line, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[15px] text-ink">
                <span className="mt-0.5 font-extrabold text-good">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-muted">{checkConfig.pricing.note}</p>
        </div>
      </Section>

      <CheckCta subject={`Kennismaking: ${scorecard.domain}`} />
    </>
  )
}
