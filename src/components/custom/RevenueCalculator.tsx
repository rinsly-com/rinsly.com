'use client'

import { useState } from 'react'

import type { Locale } from '@rinsly-com/site-core'
import { Section, SectionHeading } from '@rinsly-com/site-core/ui'

/**
 * What a partner would earn, worked out live.
 *
 * ─── The numbers here are a mirror, not a source ───────────────────────────
 * `DUTY_PCT`, `TIER_THRESHOLDS`, `TIER_STEP_PCT` and `MAX_PCT` below are copied
 * from `~/Rinsly/ledger/src/domain/tenantRate.ts`, which is what actually prices
 * a payout. The same percentages are also duplicated in the
 * `/rinsly-partnercontract` generator. If the model changes, all three change
 * together — a calculator that promises a rate the administration will not pay is
 * the worst bug this page could have.
 *
 * Two details that are easy to get wrong and are deliberate here:
 *  - the volume thresholds are **exclusive** ("more than €1.000 a month"), so a
 *    portfolio sitting exactly on €1.000 has not levelled up;
 *  - the volume levels are **cumulative**, so a partner above €25.000 carries all
 *    three and earns +15% on volume, not +5%.
 */

const DUTY_PCT = { exclusive: 10, relation: 5, marketing: 5 } as const
type Duty = keyof typeof DUTY_PCT

/** Monthly recurring revenue, ex VAT, at which each level opens. Exclusive. */
const TIER_THRESHOLDS = [1_000, 5_000, 25_000] as const
const TIER_STEP_PCT = 5
const MAX_PCT = 35

/** Plan prices ex VAT per month. Care/Managed/Growth/Op maat. */
const PLANS = [
  { key: 'care', label: 'Care', monthly: 49 },
  { key: 'managed', label: 'Managed', monthly: 99 },
  { key: 'growth', label: 'Growth', monthly: 249 },
  { key: 'opmaat', label: 'Op maat', monthly: 499 },
] as const

const COPY = {
  nl: {
    plan: 'Pakket',
    clients: 'Klanten die je bij ons onderbrengt',
    duties: 'Wat je op je neemt',
    exclusive: 'Exclusiviteit: nieuw klantwerk gaat naar Rinsly',
    relation: 'Relatiebeheer: jij bent de eerste lijn',
    marketing: 'Marketing: je noemt ons als hostingpartner',
    rate: 'Jouw tarief',
    fromDuties: 'uit verantwoordelijkheden',
    fromVolume: 'uit omzetniveau',
    portfolio: 'Portfolio-omzet',
    perMonth: 'per maand',
    perYear: 'per jaar',
    yours: 'Jouw deel',
    max: 'maximum bereikt',
    nextLevel: (amount: string) => `Nog ${amount} per maand tot het volgende niveau (+5%).`,
    zero:
      'Zonder verantwoordelijkheden is het tarief 0%. Dat is geen truc: de vergoeding betaalt niet voor een introductie die je één keer doet, maar voor werk dat elke maand doorgaat. Vink hierboven aan wat je oppakt.',
  },
  en: {
    plan: 'Plan',
    clients: 'Clients you bring to us',
    duties: 'What you take on',
    exclusive: 'Exclusivity: new client work comes to Rinsly',
    relation: 'Relationship management: you are the first line',
    marketing: 'Marketing: you name us as your hosting partner',
    rate: 'Your rate',
    fromDuties: 'from responsibilities',
    fromVolume: 'from volume level',
    portfolio: 'Portfolio revenue',
    perMonth: 'per month',
    perYear: 'per year',
    yours: 'Your share',
    max: 'maximum reached',
    nextLevel: (amount: string) => `${amount} more per month to the next level (+5%).`,
    zero:
      'With no responsibilities the rate is 0%. That is not a trick: the fee does not pay for an introduction you make once, it pays for work that continues every month. Tick what you would take on above.',
  },
} as const

const euro = (amount: number, locale: Locale) =>
  new Intl.NumberFormat(locale === 'nl' ? 'nl-NL' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)

const euroCents = (amount: number, locale: Locale) =>
  new Intl.NumberFormat(locale === 'nl' ? 'nl-NL' : 'en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

/** How many volume levels a portfolio has passed. Thresholds are exclusive. */
function volumeTier(monthly: number): number {
  return TIER_THRESHOLDS.filter((threshold) => monthly > threshold).length
}

type Props = {
  eyebrow?: string | null
  title?: string | null
  intro?: string | null
  footnote?: string | null
  locale: Locale
}

export function RevenueCalculator({ eyebrow, title, intro, footnote, locale }: Props) {
  const c = COPY[locale === 'en' ? 'en' : 'nl']
  const [planKey, setPlanKey] = useState<string>('managed')
  const [clients, setClients] = useState(10)
  const [duties, setDuties] = useState<Record<Duty, boolean>>({
    exclusive: true,
    relation: true,
    marketing: false,
  })

  const plan = PLANS.find((p) => p.key === planKey) ?? PLANS[1]
  const portfolio = plan.monthly * clients

  const dutyPct = (Object.keys(DUTY_PCT) as Duty[]).reduce(
    (sum, key) => sum + (duties[key] ? DUTY_PCT[key] : 0),
    0,
  )
  const tier = volumeTier(portfolio)
  const volumePct = tier * TIER_STEP_PCT
  const ratePct = Math.min(dutyPct + volumePct, MAX_PCT)

  const perMonth = (portfolio * ratePct) / 100
  const atMax = ratePct >= MAX_PCT
  const nextThreshold = TIER_THRESHOLDS[tier]
  const toNext = nextThreshold ? nextThreshold - portfolio + 1 : null

  const toggle = (key: Duty) => setDuties((d) => ({ ...d, [key]: !d[key] }))

  return (
    <Section className="py-14 sm:py-20">
      <SectionHeading header={{ eyebrow, title, intro }} />

      <div className="shadow-card mt-8 grid gap-0 overflow-hidden rounded-2xl border border-hair bg-card lg:grid-cols-[3fr_2fr]">
        {/* ── Inputs ─────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted">{c.plan}</span>
            <div className="flex flex-wrap gap-2">
              {PLANS.map((p) => {
                const selected = p.key === plan.key
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPlanKey(p.key)}
                    aria-pressed={selected}
                    className={[
                      'rounded-pill border px-4 py-2 text-sm font-semibold transition-colors',
                      selected
                        ? 'border-accent bg-accent text-white'
                        : 'border-hair text-ink hover:border-accent/50',
                    ].join(' ')}
                  >
                    {p.label}
                    <span className={selected ? 'ml-2 opacity-80' : 'ml-2 text-muted'}>
                      {euro(p.monthly, locale)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <label htmlFor="rc-clients" className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
                {c.clients}
              </span>
              <span className="text-xl font-extrabold tabular-nums text-ink">{clients}</span>
            </label>
            <input
              id="rc-clients"
              type="range"
              min={1}
              max={60}
              step={1}
              value={clients}
              onChange={(e) => setClients(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-hair accent-accent"
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted">
              {c.duties}
            </span>
            <div className="flex flex-col gap-2">
              {(
                [
                  ['exclusive', c.exclusive],
                  ['relation', c.relation],
                  ['marketing', c.marketing],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className={[
                    'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors',
                    duties[key] ? 'border-accent bg-accent/8' : 'border-hair hover:border-accent/50',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={duties[key]}
                    onChange={() => toggle(key)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={[
                      'flex size-5 shrink-0 items-center justify-center rounded-md border transition-all',
                      duties[key]
                        ? 'border-accent bg-accent text-white'
                        : 'border-hair bg-paper text-transparent',
                    ].join(' ')}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 12.5l4.5 4.5L19 7.5"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="min-w-0 flex-1 text-ink">{label}</span>
                  <span className="flex-none text-xs font-bold tabular-nums text-accent">
                    +{DUTY_PCT[key]}%
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── Result ─────────────────────────────────────────────────── */}
        <div className="flex flex-col justify-center gap-5 border-t border-hair bg-paper p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-muted">{c.rate}</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[52px] font-extrabold leading-none tabular-nums tracking-[-0.03em] text-accent">
                {ratePct}%
              </span>
              {atMax && (
                <span className="rounded-pill bg-accent/12 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-accent ring-1 ring-inset ring-accent/25">
                  {c.max}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-muted tabular-nums">
              {dutyPct}% {c.fromDuties} · {volumePct}% {c.fromVolume}
            </p>
          </div>

          <dl className="flex flex-col gap-2 border-t border-hair pt-4 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">{c.portfolio}</dt>
              <dd className="font-semibold tabular-nums text-ink">
                {euro(portfolio, locale)} <span className="text-muted">/ {c.perMonth}</span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="font-semibold text-ink">{c.yours}</dt>
              <dd className="text-lg font-extrabold tabular-nums text-accent">
                {euroCents(perMonth, locale)} <span className="text-muted">/ {c.perMonth}</span>
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-muted">&nbsp;</dt>
              <dd className="text-sm font-semibold tabular-nums text-ink">
                {euroCents(perMonth * 12, locale)} <span className="text-muted">/ {c.perYear}</span>
              </dd>
            </div>
          </dl>

          {ratePct === 0 ? (
            <p className="text-xs leading-relaxed text-muted">{c.zero}</p>
          ) : (
            toNext !== null && (
              <p className="text-xs leading-relaxed text-muted">
                {c.nextLevel(euro(toNext, locale))}
              </p>
            )
          )}
        </div>
      </div>

      {footnote && <p className="mt-4 max-w-[70ch] text-xs leading-relaxed text-muted">{footnote}</p>}
    </Section>
  )
}

export default RevenueCalculator
