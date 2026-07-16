'use client'

import { useState } from 'react'

import type { Locale } from '@/lib/locale'

type Status = 'idle' | 'submitting' | 'success' | 'error'

type Data = {
  bedrijf: string
  naam: string
  email: string
  subscription: string
  additions: string[]
  additionsOther: string
  bericht: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const COPY = {
  nl: {
    steps: ['Gegevens', 'Abonnement', 'Toevoegingen', 'Verzenden'],
    bedrijf: 'Bedrijf',
    naam: 'Contactpersoon',
    email: 'E-mail',
    additionsHint: 'Wat wilt u nog meer? (optioneel)',
    other: 'Anders, namelijk…',
    bericht: 'Aanvullende toelichting (optioneel)',
    back: 'Terug',
    next: 'Volgende',
    submit: 'Aanvraag versturen',
    sending: 'Versturen…',
    summary: 'Controleer uw aanvraag',
    none: 'Geen',
    success: 'Bedankt! We hebben uw aanvraag ontvangen en nemen zo snel mogelijk contact met u op.',
    error: 'Er ging iets mis. Probeer het later opnieuw of mail ons direct.',
  },
  en: {
    steps: ['Information', 'Subscription', 'Additions', 'Confirm'],
    bedrijf: 'Company',
    naam: 'Contact person',
    email: 'Email',
    additionsHint: 'Anything else you need? (optional)',
    other: 'Other, namely…',
    bericht: 'Additional notes (optional)',
    back: 'Back',
    next: 'Next',
    submit: 'Send request',
    sending: 'Sending…',
    summary: 'Review your request',
    none: 'None',
    success: 'Thanks! We’ve received your request and will get back to you as soon as possible.',
    error: 'Something went wrong. Please try again later or email us directly.',
  },
} as const

const SUBSCRIPTIONS = [
  { value: 'basis', nl: 'Basis', en: 'Basic', price: '€45 / mnd', priceEn: '€45 / mo', recommended: false },
  { value: 'onderhoud', nl: 'Hosting & Onderhoud', en: 'Hosting & Maintenance', price: '€90 / mnd', priceEn: '€90 / mo', recommended: true },
  { value: 'opmaat', nl: 'Op maat', en: 'Custom', price: 'Op aanvraag', priceEn: 'On request', recommended: false },
] as const

const ADDITIONS = [
  { value: 'localization', nl: 'Meertaligheid', en: 'Localization' },
  { value: 'email', nl: 'E-mail op eigen domein', en: 'Email on your domain' },
  { value: 'design', nl: 'Vormgeving & huisstijl', en: 'Design & branding' },
  { value: 'seo', nl: 'SEO & vindbaarheid', en: 'SEO' },
  { value: 'content', nl: 'Content & teksten', en: 'Content & copy' },
  { value: 'other', nl: 'Anders', en: 'Other' },
] as const

const inputClass =
  'w-full rounded-lg border border-hair bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent'

const EMPTY: Data = {
  bedrijf: '',
  naam: '',
  email: '',
  subscription: '',
  additions: [],
  additionsOther: '',
  bericht: '',
}

/** Multi-step quote-request wizard → POST /api/offerte. */
export function OfferteForm({ locale }: { locale: Locale }) {
  const c = COPY[locale]
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Data>(EMPTY)
  const [status, setStatus] = useState<Status>('idle')

  const set = <K extends keyof Data>(key: K, value: Data[K]) =>
    setData((d) => ({ ...d, [key]: value }))

  const toggleAddition = (value: string) =>
    setData((d) => ({
      ...d,
      additions: d.additions.includes(value)
        ? d.additions.filter((v) => v !== value)
        : [...d.additions, value],
    }))

  const stepValid = (s: number): boolean => {
    if (s === 0) return data.bedrijf.trim() !== '' && data.naam.trim() !== '' && EMAIL_RE.test(data.email)
    if (s === 1) return data.subscription !== ''
    return true
  }

  const subLabel = (value: string) => {
    const sub = SUBSCRIPTIONS.find((s) => s.value === value)
    return sub ? (locale === 'nl' ? sub.nl : sub.en) : value
  }
  const addLabel = (value: string) => {
    const add = ADDITIONS.find((a) => a.value === value)
    return add ? (locale === 'nl' ? add.nl : add.en) : value
  }

  async function submit() {
    if (status === 'submitting') return
    setStatus('submitting')
    try {
      const res = await fetch('/api/offerte', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean }
      if (res.ok && body.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="shadow-card flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-good/40 bg-card p-8 text-center">
        <span className="rinsly-check-circle mx-auto flex size-16 items-center justify-center rounded-full bg-good text-white">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              className="rinsly-check-path"
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="max-w-sm text-sm text-ink">{c.success}</p>
      </div>
    )
  }

  return (
    <div className="shadow-card rounded-2xl border border-hair bg-card p-6">
      {/* Step indicator */}
      <ol className="mb-6 flex items-center gap-2">
        {c.steps.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={[
                'h-1 rounded-full transition-colors',
                i <= step ? 'bg-accent' : 'bg-hair',
              ].join(' ')}
            />
            <span
              className={[
                'text-[11px] font-semibold',
                i === step ? 'text-accent' : 'text-muted',
              ].join(' ')}
            >
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      {/* Honeypot */}
      <input
        type="text"
        value=""
        onChange={() => {}}
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {/* Step 1 — Information */}
      {step === 0 && (
        <div className="flex flex-col gap-3">
          <input
            value={data.bedrijf}
            onChange={(e) => set('bedrijf', e.target.value)}
            placeholder={c.bedrijf}
            className={inputClass}
            aria-label={c.bedrijf}
          />
          <input
            value={data.naam}
            onChange={(e) => set('naam', e.target.value)}
            placeholder={c.naam}
            className={inputClass}
            aria-label={c.naam}
          />
          <input
            value={data.email}
            onChange={(e) => set('email', e.target.value)}
            type="email"
            placeholder={c.email}
            className={inputClass}
            aria-label={c.email}
          />
        </div>
      )}

      {/* Step 2 — Subscription */}
      {step === 1 && (
        <div className="flex flex-col gap-2.5">
          {SUBSCRIPTIONS.map((s) => {
            const selected = data.subscription === s.value
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => set('subscription', s.value)}
                className={[
                  'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                  selected ? 'border-accent bg-accent-soft' : 'border-hair hover:border-accent/50',
                ].join(' ')}
              >
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-ink">
                    {locale === 'nl' ? s.nl : s.en}
                    {s.recommended && (
                      <span className="ml-2 rounded-pill bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                        {locale === 'nl' ? 'Aanbevolen' : 'Recommended'}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted">{locale === 'nl' ? s.price : s.priceEn}</span>
                </span>
                <span
                  className={[
                    'flex size-5 shrink-0 items-center justify-center rounded-full border',
                    selected ? 'border-accent bg-accent text-white' : 'border-hair',
                  ].join(' ')}
                >
                  {selected ? '✓' : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Step 3 — Additions */}
      {step === 2 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm text-muted">{c.additionsHint}</p>
          {ADDITIONS.map((a) => {
            const checked = data.additions.includes(a.value)
            return (
              <label
                key={a.value}
                className={[
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
                  checked ? 'border-accent bg-accent-soft' : 'border-hair hover:border-accent/50',
                ].join(' ')}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAddition(a.value)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={[
                    'flex size-5 shrink-0 items-center justify-center rounded-md border transition-all',
                    checked ? 'border-accent bg-accent text-white' : 'border-hair bg-paper text-transparent',
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
                <span className="text-ink">{locale === 'nl' ? a.nl : a.en}</span>
              </label>
            )
          })}
          {data.additions.includes('other') && (
            <input
              value={data.additionsOther}
              onChange={(e) => set('additionsOther', e.target.value)}
              placeholder={c.other}
              className={inputClass}
              aria-label={c.other}
            />
          )}
        </div>
      )}

      {/* Step 4 — Confirm */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-ink">{c.summary}</p>
          <dl className="flex flex-col gap-2 rounded-xl border border-hair bg-paper p-4 text-sm">
            <Row label={c.bedrijf} value={data.bedrijf} />
            <Row label={c.naam} value={data.naam} />
            <Row label={c.email} value={data.email} />
            <Row label={c.steps[1]} value={subLabel(data.subscription)} />
            <Row
              label={c.steps[2]}
              value={
                data.additions.length
                  ? data.additions
                      .map((v) => (v === 'other' && data.additionsOther ? data.additionsOther : addLabel(v)))
                      .join(', ')
                  : c.none
              }
            />
          </dl>
          <textarea
            value={data.bericht}
            onChange={(e) => set('bericht', e.target.value)}
            rows={3}
            placeholder={c.bericht}
            className={`${inputClass} resize-y`}
            aria-label={c.bericht}
          />
          {status === 'error' && <p className="text-sm text-red-600">{c.error}</p>}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="rounded-pill px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink disabled:invisible"
        >
          {c.back}
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={() => stepValid(step) && setStep((s) => s + 1)}
            disabled={!stepValid(step)}
            className="rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {c.next}
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={status === 'submitting'}
            className="rounded-pill bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {status === 'submitting' ? c.sending : c.submit}
          </button>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  )
}

export default OfferteForm
