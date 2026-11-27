'use client'

import { useState } from 'react'

import type { Locale } from '@rinsly-com/site-core'
import { Section, SectionHeading } from '@rinsly-com/site-core/ui'

import { LADDER_V33, partnerRateV33, type RungsV33 } from '@/lib/partnerLadder'

/**
 * What a partner would earn, worked out live, on the terms v3.3 ladder
 * (art. 5): Basis 10% · Eerste lijn +10% · Verkoop +10% · Volume +5% from
 * five paying attributed end clients, maximum 35%.
 *
 * The percentages come from `LADDER_V33` in `src/lib/partnerLadder.ts`, which
 * must match Ledger's tenantRate.ts and the contract generator. A calculator
 * that promises a rate the administration will not pay is the worst bug this
 * page could have.
 */

type Rung = keyof RungsV33

/** Plan prices ex VAT per month. Care/Managed/Growth/Op maat (Op maat shown as "vanaf", PA-14). */
const PLANS = [
  { key: 'care', label: { nl: 'Care', en: 'Care' }, monthly: 49, from: false },
  { key: 'managed', label: { nl: 'Managed', en: 'Managed' }, monthly: 99, from: false },
  { key: 'growth', label: { nl: 'Growth', en: 'Growth' }, monthly: 249, from: false },
  { key: 'opmaat', label: { nl: 'Op maat', en: 'Custom' }, monthly: 499, from: true },
] as const

const COPY = {
  nl: {
    plan: 'Pakket',
    from: 'vanaf',
    clients: 'Klanten die je bij ons onderbrengt',
    duties: 'Wat je op je neemt',
    firstLine: 'Eerste lijn',
    sales: 'Verkoop',
    rate: 'Jouw tarief',
    base: 'Basis',
    volume: 'Volume',
    portfolio: 'Portfolio-omzet',
    perMonth: 'per maand',
    perYear: 'per jaar',
    yours: 'Jouw deel',
    volumeRule: 'Volume telt vanaf vijf betalende toegeschreven eindklanten.',
  },
  en: {
    plan: 'Plan',
    from: 'from',
    clients: 'Clients you bring to us',
    duties: 'What you take on',
    firstLine: 'First line',
    sales: 'Sales',
    rate: 'Your rate',
    base: 'Base',
    volume: 'Volume',
    portfolio: 'Portfolio revenue',
    perMonth: 'per month',
    perYear: 'per year',
    yours: 'Your share',
    volumeRule: 'Volume counts from five paying attributed end clients.',
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

type Props = {
  eyebrow?: string | null
  title?: string | null
  intro?: string | null
  footnote?: string | null
  locale: Locale
}

export function RevenueCalculator({ eyebrow, title, intro, footnote, locale }: Props) {
  const lang = locale === 'en' ? 'en' : 'nl'
  const c = COPY[lang]
  const [planKey, setPlanKey] = useState<string>('managed')
  const [clients, setClients] = useState(3)
  const [rungs, setRungs] = useState<RungsV33>({ firstLine: true, sales: false })

  const plan = PLANS.find((p) => p.key === planKey) ?? PLANS[1]
  const portfolio = plan.monthly * clients
  const rate = partnerRateV33(rungs, clients)
  const ratePct = rate.total
  const perMonth = (portfolio * ratePct) / 100

  const toggle = (key: Rung) => { setRungs((r) => ({ ...r, [key]: !r[key] })); }
  const rungPct: Record<Rung, number> = { firstLine: LADDER_V33.firstLinePct, sales: LADDER_V33.salesPct }
  const breakdown = [
    [c.base, rate.base],
    [c.firstLine, rate.firstLine],
    [c.sales, rate.sales],
    [c.volume, rate.volume],
  ] as const

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
                    onClick={() => { setPlanKey(p.key); }}
                    aria-pressed={selected}
                    className={[
                      'rounded-pill border px-4 py-2 text-sm font-semibold transition-colors',
                      selected
                        ? 'border-accent bg-accent text-white'
                        : 'border-hair text-ink hover:border-accent/50',
                    ].join(' ')}
                  >
                    {p.label[lang]}
                    {/* Full white on the accent pill (4.9:1); weight, not opacity, sets the price apart (axe). */}
                    <span className={selected ? 'ml-2 font-normal' : 'ml-2 text-muted'}>
                      {p.from ? `${c.from} ` : ''}
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
              onChange={(e) => { setClients(Number(e.target.value)); }}
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
                  ['firstLine', c.firstLine],
                  ['sales', c.sales],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className={[
                    'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-2.5 text-sm transition-colors',
                    rungs[key] ? 'border-accent bg-accent/8' : 'border-hair hover:border-accent/50',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={rungs[key]}
                    onChange={() => { toggle(key); }}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={[
                      'flex size-5 shrink-0 items-center justify-center rounded-md border transition-all',
                      rungs[key]
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
                  <span className="flex-none text-xs font-bold tabular-nums text-accent-strong">
                    +{rungPct[key]}%
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
            </div>
            <p className="mt-1.5 text-xs text-muted tabular-nums">
              {breakdown.map(([label, pct]) => `${label} ${pct}%`).join(' · ')}
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

          <p className="text-xs leading-relaxed text-muted">{c.volumeRule}</p>
        </div>
      </div>

      {footnote && <p className="mt-4 max-w-[70ch] text-xs leading-relaxed text-muted">{footnote}</p>}
    </Section>
  )
}
