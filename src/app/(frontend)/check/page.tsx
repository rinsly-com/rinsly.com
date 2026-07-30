import type { Metadata } from 'next'

import { Eyebrow, Icon, Section, SectionHeading } from '@rinsly-com/site-core/ui'

import { CheckAanvraagForm } from '@/components/check/CheckAanvraagForm'
import { CheckRunner } from '@/components/check/CheckRunner'

/**
 * Generic /check page — the self-service website check (visitor enters a
 * domain, our pipeline generates a personal /check/<token> scorecard), plus
 * the manual "wij kijken mee" lead form as secondary path and as the landing
 * spot for expired personal links (?link=verlopen). Fully static (part of the
 * rinsly.com export); both forms talk to the accp API cross-origin.
 */

export const metadata: Metadata = {
  title: 'Gratis websitecheck | Rinsly',
  description:
    'Test uw website gratis op moderniteit, snelheid, mobiel gebruik, vindbaarheid en veiligheid, met direct resultaat.',
  robots: { index: false, follow: false },
}

const CHECKS = [
  { icon: 'IconSparkles', label: 'Moderniteit' },
  { icon: 'IconBolt', label: 'Snelheid' },
  { icon: 'IconDeviceMobile', label: 'Mobiel' },
  { icon: 'IconSearch', label: 'Vindbaarheid' },
  { icon: 'IconShieldCheck', label: 'Veiligheid' },
] as const

export default function CheckPage() {
  return (
    <>
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
              Test uw website, gratis en direct
            </h1>
            <p
              data-hero-el
              style={{ animationDelay: '0.18s' }}
              className="max-w-[60ch] text-[17px] leading-relaxed text-muted"
            >
              Vul uw websiteadres in en ontvang binnen een halve minuut een persoonlijke scorecard:
              vijf rapportcijfers, concrete bevindingen en wat wij eraan zouden doen. Vrijblijvend,
              u zit nergens aan vast.
            </p>
          </div>
        </Section>
      </div>

      <Section className="pb-12 sm:pb-16">
        <div className="grid items-start gap-8 lg:grid-cols-[3fr_2fr]">
          <div className="order-2 lg:order-1">
            <CheckRunner />
          </div>
          <div data-reveal className="order-1 flex flex-col gap-4 lg:order-2">
            <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">Wat we testen</h2>
            <ul className="flex flex-col gap-2.5">
              {CHECKS.map((check) => (
                <li key={check.label} className="flex items-center gap-3 text-[15px] text-ink">
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <Icon name={check.icon} fallback="IconPoint" size={18} stroke={1.75} />
                  </span>
                  {check.label}
                </li>
              ))}
            </ul>
            <p className="text-sm leading-relaxed text-muted">
              U krijgt het rapport meteen te zien, met een eerlijk advies, ook als dat advies is om
              niets te doen.
            </p>
          </div>
        </div>
      </Section>

      <Section className="pb-16 sm:pb-20">
        <SectionHeading
          header={{
            eyebrow: 'Liever persoonlijk?',
            title: 'Wij kijken graag met u mee',
            intro:
              'Laat uw gegevens achter en we nemen binnen één werkdag contact op, met een uitgebreidere beoordeling en concreet advies.',
          }}
        />
        <div className="mt-8 max-w-xl">
          <CheckAanvraagForm />
        </div>
      </Section>
    </>
  )
}
