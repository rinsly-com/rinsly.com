import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Eyebrow, Section } from '@rinsly-com/site-core/ui'

import { PartnerTokenGate } from '@/components/partner/PartnerTokenGate'

/**
 * /partner — where a recruited studio configures itself.
 *
 * Reached through a signed invite link (?token=…) minted by Rinsly Lens. The
 * token carries who they are, so the form arrives prefilled without this page
 * knowing anything about the recruitment pipeline.
 *
 * noindex: every visit here should come from an invitation. Someone landing
 * without a token gets an explanation and an e-mail address, not a form.
 */
export const metadata: Metadata = {
  title: 'Word Rinsly-partner',
  description:
    'Stel samen wat je wilt oppakken en wat je daarvoor terugkrijgt van de doorlopende omzet.',
  robots: { index: false, follow: false },
}

const LADDER = [
  { pct: '+10%', label: 'Exclusiviteit', kind: 'keuze' },
  { pct: '+5%', label: 'Relatiebeheer & eerstelijnssupport', kind: 'keuze' },
  { pct: '+5%', label: 'Marketing & naamsvermelding', kind: 'keuze' },
  { pct: '+5%', label: 'Meer dan €1.000 per maand', kind: 'omzet' },
  { pct: '+5%', label: 'Meer dan €5.000 per maand', kind: 'omzet' },
  { pct: '+5%', label: 'Meer dan €25.000 per maand', kind: 'omzet' },
]

export default function PartnerPage() {
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
              <Eyebrow>Partnerprogramma</Eyebrow>
            </span>
            <h1
              data-hero-title
              className="text-[clamp(32px,6vw,52px)] font-extrabold leading-[1.05] tracking-[-0.025em] text-ink"
            >
              Jullie ontwerpen. Wij bouwen en houden het draaiend.
            </h1>
            <p
              data-hero-el
              style={{ animationDelay: '0.18s' }}
              className="max-w-[62ch] text-[17px] leading-relaxed text-muted"
            >
              Breng je klanten bij ons onder en krijg een deel van de doorlopende omzet — elke
              maand, zolang die klant blijft. Hoeveel je krijgt bepaal je zelf, door te kiezen wat
              je op je neemt.
            </p>
          </div>
        </Section>
      </div>

      <Section className="pb-12 sm:pb-16">
        <div className="grid items-start gap-10 lg:grid-cols-[3fr_2fr]">
          <div className="order-2 lg:order-1">
            <Suspense fallback={<p className="text-sm text-muted">Even je link controleren…</p>}>
              <PartnerTokenGate />
            </Suspense>
          </div>

          <aside data-reveal className="order-1 flex flex-col gap-4 lg:order-2">
            <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">Hoe het tarief werkt</h2>
            <p className="text-sm leading-relaxed text-muted">
              De basis is <strong className="text-ink">0%</strong>. Dat is geen truc: de vergoeding
              betaalt niet voor een introductie die je één keer doet, maar voor werk dat je elke
              maand blijft doen.
            </p>
            <ul className="flex flex-col divide-y divide-hair rounded-xl border border-hair bg-card">
              {LADDER.map((row) => (
                <li key={row.label} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
                  <span className="w-12 flex-none font-bold tabular-nums text-accent">{row.pct}</span>
                  <span className="min-w-0 flex-1 text-ink">{row.label}</span>
                  <span className="flex-none text-[10.5px] font-bold uppercase tracking-wider text-muted">
                    {row.kind}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-relaxed text-muted">
              De omzetniveaus tellen bij elkaar op, dus boven €25.000 per maand is dat +15%, niet
              +5%. Maximaal <strong className="text-ink">35%</strong> van de doorlopende
              abonnementsomzet, ex btw. Eenmalige bouwkosten vallen erbuiten.
            </p>
            <p className="text-sm leading-relaxed text-muted">
              Eén harde eis: een eigen Figma-licentie met Dev Mode. Ontwerpen leveren we in Figma
              aan.
            </p>
          </aside>
        </div>
      </Section>
    </>
  )
}
