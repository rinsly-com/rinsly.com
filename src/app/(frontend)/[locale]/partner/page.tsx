import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Eyebrow, Section } from '@rinsly-com/site-core/ui'

import { PartnerTokenGate } from '@/components/partner/PartnerTokenGate'

/**
 * /nl/partner and /en/partner — where a recruited studio configures itself.
 *
 * Reached through a signed invite link (?token=…) minted by Rinsly Lens. The
 * token carries who they are, so the form arrives prefilled without this page
 * knowing anything about the recruitment pipeline.
 *
 * Lives under [locale] rather than at the root like /check, for two reasons: the
 * locale layout is what pulls in globals.css and the site chrome, and unlike
 * /check (Dutch local businesses only) a design studio worth recruiting may well
 * be German or Belgian. The invite link picks the locale from the candidate's
 * country; a bare /partner is redirected to /nl by next.config.
 *
 * noindex: every visit should come from an invitation. Someone arriving without
 * a token gets an explanation and an address, not a form.
 */

// force-dynamic on the accp worker, like every other [locale] route: the locale
// layout reads the header/footer globals from D1, which does not exist at build
// time. The static prod build (scripts/build-static.mjs) strips this line and
// prerenders from the layout's locale params.
export const dynamic = 'force-dynamic'

type Params = { locale: string }

const COPY = {
  nl: {
    title: 'Word Rinsly-partner',
    description:
      'Stel samen wat je wilt oppakken en wat je daarvoor terugkrijgt van de doorlopende omzet.',
    eyebrow: 'Partnerprogramma',
    heading: 'Jullie ontwerpen. Wij bouwen en houden het draaiend.',
    lede: 'Breng je klanten bij ons onder en krijg een deel van de doorlopende omzet — elke maand, zolang die klant blijft. Hoeveel je krijgt bepaal je zelf, door te kiezen wat je op je neemt.',
    checking: 'Even je link controleren…',
    asideTitle: 'Hoe het tarief werkt',
    asideBase:
      'De basis is 0%. Dat is geen truc: de vergoeding betaalt niet voor een introductie die je één keer doet, maar voor werk dat je elke maand blijft doen.',
    asideCumulative:
      'De omzetniveaus tellen bij elkaar op, dus boven €25.000 per maand is dat +15%, niet +5%. Maximaal 35% van de doorlopende abonnementsomzet, ex btw. Eenmalige bouwkosten vallen erbuiten.',
    asideFigma:
      'Eén harde eis: een eigen Figma-licentie met Dev Mode. Ontwerpen leveren we in Figma aan.',
    ladder: [
      { pct: '+10%', label: 'Exclusiviteit', kind: 'keuze' },
      { pct: '+5%', label: 'Relatiebeheer & eerstelijnssupport', kind: 'keuze' },
      { pct: '+5%', label: 'Marketing & naamsvermelding', kind: 'keuze' },
      { pct: '+5%', label: 'Meer dan €1.000 per maand', kind: 'omzet' },
      { pct: '+5%', label: 'Meer dan €5.000 per maand', kind: 'omzet' },
      { pct: '+5%', label: 'Meer dan €25.000 per maand', kind: 'omzet' },
    ],
  },
  en: {
    title: 'Become a Rinsly partner',
    description:
      'Choose what you want to take on, and see what it earns you from the recurring revenue.',
    eyebrow: 'Partner programme',
    heading: 'You design. We build it and keep it running.',
    lede: 'Bring us your clients and take a share of the recurring revenue — every month, for as long as that client stays. How much is up to you: it follows from what you take on.',
    checking: 'Just checking your link…',
    asideTitle: 'How the rate works',
    asideBase:
      'The base is 0%. That is not a trick: the fee does not pay for an introduction you make once, it pays for work you keep doing every month.',
    asideCumulative:
      'The revenue levels stack, so above €25.000 a month that is +15%, not +5%. At most 35% of the recurring subscription revenue, excl. VAT. One-off build fees are not shared.',
    asideFigma:
      'One hard requirement: your own Figma licence with Dev Mode. Designs are delivered in Figma.',
    ladder: [
      { pct: '+10%', label: 'Exclusivity', kind: 'choice' },
      { pct: '+5%', label: 'Relation & first-line support', kind: 'choice' },
      { pct: '+5%', label: 'Marketing & attribution', kind: 'choice' },
      { pct: '+5%', label: 'More than €1.000 per month', kind: 'revenue' },
      { pct: '+5%', label: 'More than €5.000 per month', kind: 'revenue' },
      { pct: '+5%', label: 'More than €25.000 per month', kind: 'revenue' },
    ],
  },
} as const

/** Anything that is not English falls back to Dutch, the site's default. */
const copyFor = (locale: string) => (locale === 'en' ? COPY.en : COPY.nl)

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale } = await params
  const t = copyFor(locale)
  return {
    title: `${t.title} | Rinsly`,
    description: t.description,
    robots: { index: false, follow: false },
  }
}

export default async function PartnerPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const t = copyFor(locale)

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
              <Eyebrow>{t.eyebrow}</Eyebrow>
            </span>
            <h1
              data-hero-title
              className="text-[clamp(32px,6vw,52px)] font-extrabold leading-[1.05] tracking-[-0.025em] text-ink"
            >
              {t.heading}
            </h1>
            <p
              data-hero-el
              style={{ animationDelay: '0.18s' }}
              className="max-w-[62ch] text-[17px] leading-relaxed text-muted"
            >
              {t.lede}
            </p>
          </div>
        </Section>
      </div>

      <Section className="pb-16 sm:pb-24">
        <div className="grid items-start gap-10 lg:grid-cols-[3fr_2fr]">
          <div className="order-2 lg:order-1">
            <Suspense fallback={<p className="text-sm text-muted">{t.checking}</p>}>
              <PartnerTokenGate locale={locale === 'en' ? 'en' : 'nl'} />
            </Suspense>
          </div>

          <aside data-reveal className="order-1 flex flex-col gap-4 lg:order-2">
            <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">{t.asideTitle}</h2>
            <p className="text-sm leading-relaxed text-muted">{t.asideBase}</p>
            <ul className="flex flex-col divide-y divide-hair rounded-xl border border-hair bg-card">
              {t.ladder.map((row) => (
                <li key={row.label} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
                  <span className="w-12 flex-none font-bold tabular-nums text-accent">
                    {row.pct}
                  </span>
                  <span className="min-w-0 flex-1 text-ink">{row.label}</span>
                  <span className="flex-none text-[10.5px] font-bold uppercase tracking-wider text-muted">
                    {row.kind}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-sm leading-relaxed text-muted">{t.asideCumulative}</p>
            <p className="text-sm leading-relaxed text-muted">{t.asideFigma}</p>
          </aside>
        </div>
      </Section>
    </>
  )
}
