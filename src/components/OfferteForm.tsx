'use client'

import { useState } from 'react'

import type { Locale } from '@rinsly-com/site-core'

type Status = 'idle' | 'submitting' | 'success' | 'error'

/** Which of the two audiences is filling this in. Chosen on the first step. */
type Audience = '' | 'client' | 'partner'

type Data = {
  // Shared
  bedrijf: string
  naam: string
  email: string
  bericht: string
  // Client path
  subscription: string
  additions: string[]
  additionsOther: string
  // Partner path
  domein: string
  telefoon: string
  bouwtZelf: boolean
  verkooptHosting: boolean
  figmaSeat: boolean
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// On the dynamic accp site this is same-origin (empty base). On the static prod
// site (rinsly.com) there is no API, so the build inlines the accp origin here
// (NEXT_PUBLIC_API_URL) and the form posts cross-origin to accp (CORS-allowed).
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')

const COPY = {
  nl: {
    who: 'Wie ben je?',
    whoHint: 'Zo stellen we de juiste vragen, en geen enkele overbodige.',
    clientCard: 'Ik wil een website',
    clientCardSub: 'Een bedrijf dat een site wil laten bouwen en hosten.',
    partnerCard: 'Ik ben een ontwerpstudio',
    partnerCardSub: 'Ik ontwerp websites en wil ze door Rinsly laten bouwen en hosten.',
    stepsClient: ['Wie', 'Gegevens', 'Abonnement', 'Wensen', 'Verzenden'],
    stepsPartner: ['Wie', 'Studio', 'Werkwijze', 'Verzenden'],
    bedrijf: 'Bedrijf',
    studio: 'Naam van je studio',
    naam: 'Contactpersoon',
    email: 'E-mail',
    telefoon: 'Telefoon (optioneel)',
    domein: 'Je eigen website',
    additionsHint: 'Wat wilt u nog meer? (optioneel)',
    other: 'Anders, namelijk…',
    bericht: 'Aanvullende toelichting (optioneel)',
    partnerBericht: 'Waar werk je aan, en wat wil je weten? (optioneel)',
    qualHint: 'Drie vragen die bepalen of dit voor jou werkt. Eerlijk antwoorden helpt jou het meest.',
    bouwtZelf: 'We bouwen onze websites zelf',
    verkooptHosting: 'We verkopen zelf al hosting',
    figmaSeat: 'We hebben een Figma-licentie met Dev Mode',
    figmaNote: 'Dit is de enige harde eis. Wij bouwen uit Dev Mode.',
    buildWarn:
      'Dan is dit misschien niets voor je, en dat zeggen we liever nu. Dit werkt als bouwen het deel is dat je week opeet en niet betaalt zoals ontwerpen betaalt. Bouw je graag, blijf dan bouwen: je mag het gesprek natuurlijk nog steeds aangaan.',
    hostingWarn:
      'Verkoop je al hosting, dan levert ons programma je waarschijnlijk weinig op. Stuur het gerust toch in, dan kijken we ernaar.',
    back: 'Terug',
    next: 'Volgende',
    submit: 'Aanvraag versturen',
    sending: 'Versturen…',
    summary: 'Controleer je aanvraag',
    none: 'Geen',
    yes: 'Ja',
    no: 'Nee',
    success: 'Bedankt! We hebben uw aanvraag ontvangen en nemen zo snel mogelijk contact met u op.',
    partnerSuccess: 'Bedankt! We hebben je aanmelding ontvangen en nemen snel contact op: meestal binnen een paar werkdagen.',
    error: 'Er ging iets mis. Probeer het later opnieuw of mail ons direct.',
  },
  en: {
    who: 'Who are you?',
    whoHint: 'So we ask the right questions, and none of the pointless ones.',
    clientCard: 'I want a website',
    clientCardSub: 'A business looking to have a site built and hosted.',
    partnerCard: 'I’m a design studio',
    partnerCardSub: 'I design websites and want Rinsly to build and host them.',
    stepsClient: ['Who', 'Details', 'Subscription', 'Needs', 'Confirm'],
    stepsPartner: ['Who', 'Studio', 'How you work', 'Confirm'],
    bedrijf: 'Company',
    studio: 'Your studio’s name',
    naam: 'Contact person',
    email: 'Email',
    telefoon: 'Phone (optional)',
    domein: 'Your own website',
    additionsHint: 'Anything else you need? (optional)',
    other: 'Other, namely…',
    bericht: 'Additional notes (optional)',
    partnerBericht: 'What are you working on, and what would you like to know? (optional)',
    qualHint: 'Three questions that decide whether this works for you. Answering honestly helps you most.',
    bouwtZelf: 'We build our websites ourselves',
    verkooptHosting: 'We already sell hosting',
    figmaSeat: 'We have a Figma licence with Dev Mode',
    figmaNote: 'This is the only hard requirement: we build from Dev Mode.',
    buildWarn:
      'Then this may not be for you, and we’d rather say so now. It works when building is the part that eats your week and doesn’t pay like design does. If you like building, keep building: you’re still welcome to talk, of course.',
    hostingWarn:
      'If you already sell hosting, our programme probably has little to offer you. Send it anyway and we’ll take a look.',
    back: 'Back',
    next: 'Next',
    submit: 'Send request',
    sending: 'Sending…',
    summary: 'Review your request',
    none: 'None',
    yes: 'Yes',
    no: 'No',
    success: 'Thanks! We’ve received your request and will get back to you as soon as possible.',
    partnerSuccess: 'Thanks! We’ve received your application and will be in touch soon: usually within a few working days.',
    error: 'Something went wrong. Please try again later or email us directly.',
  },
} as const

// The `value`s are the stored Offertes enum and stay as they are; only the labels
// track the tier names. `partner` is displayed as **Growth** — "Partner" now means
// a design studio, never a subscription tier. Renaming the stored value needs a
// migration; see FACILITATOR-MIGRATION.md in the repo root.
const SUBSCRIPTIONS = [
  { value: 'care', nl: 'Care', en: 'Care', price: '€49 / mnd', priceEn: '€49 / mo', recommended: false },
  { value: 'beheerd', nl: 'Managed', en: 'Managed', price: '€99 / mnd', priceEn: '€99 / mo', recommended: true },
  { value: 'partner', nl: 'Growth', en: 'Growth', price: '€249 / mnd', priceEn: '€249 / mo', recommended: false },
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
  bericht: '',
  subscription: '',
  additions: [],
  additionsOther: '',
  domein: '',
  telefoon: '',
  bouwtZelf: false,
  verkooptHosting: false,
  figmaSeat: false,
}

/**
 * The contact wizard, for both audiences.
 *
 * Step 0 asks which one you are, and the rest of the form follows from that:
 *
 *   client  → subscription + wishes  → POST /api/offerte          (Offertes)
 *   partner → studio + qualification → POST /api/partner-interesse (PartnerAanvragen)
 *
 * The partner branch cannot use `/api/partner-aanvraag`: that one is token-gated
 * on purpose, because it is the configurator a *recruited* studio fills in from a
 * signed invite link. A studio arriving here has no token, hence the separate
 * public endpoint.
 */
export function OfferteForm({ locale }: { locale: Locale }) {
  const c = COPY[locale]
  const [audience, setAudience] = useState<Audience>('')
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Data>(EMPTY)
  const [status, setStatus] = useState<Status>('idle')
  const [trap, setTrap] = useState('')

  const isPartner = audience === 'partner'
  const steps: readonly string[] = isPartner ? c.stepsPartner : c.stepsClient
  const lastStep = audience === '' ? 0 : steps.length - 1

  const set = <K extends keyof Data>(key: K, value: Data[K]) =>
    setData((d) => ({ ...d, [key]: value }))

  const toggleAddition = (value: string) =>
    setData((d) => ({
      ...d,
      additions: d.additions.includes(value)
        ? d.additions.filter((v) => v !== value)
        : [...d.additions, value],
    }))

  /** Picking an audience is itself the first step's answer, so advance with it. */
  const choose = (next: Audience) => {
    setAudience(next)
    setStep(1)
  }

  const stepValid = (s: number): boolean => {
    if (s === 0) return audience !== ''
    if (isPartner) {
      if (s === 1) {
        return data.bedrijf.trim() !== '' && EMAIL_RE.test(data.email) && data.domein.trim() !== ''
      }
      return true
    }
    if (s === 1) return data.bedrijf.trim() !== '' && data.naam.trim() !== '' && EMAIL_RE.test(data.email)
    if (s === 2) return data.subscription !== ''
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
  const yn = (v: boolean) => (v ? c.yes : c.no)

  async function submit() {
    if (status === 'submitting') return
    setStatus('submitting')

    const url = isPartner ? '/api/partner-interesse' : '/api/offerte'
    const payload = isPartner
      ? {
          honeypot: trap,
          bedrijfsnaam: data.bedrijf,
          contactpersoon: data.naam,
          email: data.email,
          telefoon: data.telefoon,
          domein: data.domein,
          bouwtZelf: data.bouwtZelf,
          verkooptHosting: data.verkooptHosting,
          figmaSeat: data.figmaSeat,
          opmerking: data.bericht,
        }
      : {
          website: trap,
          bedrijf: data.bedrijf,
          naam: data.naam,
          email: data.email,
          subscription: data.subscription,
          additions: data.additions,
          additionsOther: data.additionsOther,
          bericht: data.bericht,
        }

    try {
      const res = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean }
      setStatus(res.ok && body.ok ? 'success' : 'error')
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
        <p className="max-w-sm text-sm text-ink">{isPartner ? c.partnerSuccess : c.success}</p>
      </div>
    )
  }

  return (
    <div className="shadow-card rounded-2xl border border-hair bg-card p-6">
      {/* Step indicator */}
      <ol className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={['h-1 rounded-full transition-colors', i <= step ? 'bg-accent' : 'bg-hair'].join(' ')}
            />
            <span
              className={['text-[11px] font-semibold', i === step ? 'text-accent' : 'text-muted'].join(' ')}
            >
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      {/* Honeypot. Sent as `website` for the client path and `honeypot` for the
          partner path, because on the partner form a website is a real answer. */}
      <input
        type="text"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        name="contact-extra"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {/* Step 1: who are you */}
      {step === 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-ink">{c.who}</p>
          <p className="-mt-1 text-sm text-muted">{c.whoHint}</p>
          {(
            [
              { key: 'partner', title: c.partnerCard, sub: c.partnerCardSub },
              { key: 'client', title: c.clientCard, sub: c.clientCardSub },
            ] as const
          ).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => choose(option.key)}
              className="flex flex-col gap-1 rounded-xl border border-hair px-4 py-3.5 text-left transition-colors hover:border-accent/60 hover:bg-accent-soft"
            >
              <span className="text-sm font-semibold text-ink">{option.title}</span>
              <span className="text-xs text-muted">{option.sub}</span>
            </button>
          ))}
        </div>
      )}

      {/* ---------------------------- partner path ---------------------------- */}

      {isPartner && step === 1 && (
        <div className="flex flex-col gap-3">
          <input
            value={data.bedrijf}
            onChange={(e) => set('bedrijf', e.target.value)}
            placeholder={c.studio}
            className={inputClass}
            aria-label={c.studio}
          />
          <input
            value={data.domein}
            onChange={(e) => set('domein', e.target.value)}
            placeholder={c.domein}
            className={inputClass}
            aria-label={c.domein}
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
          <input
            value={data.telefoon}
            onChange={(e) => set('telefoon', e.target.value)}
            placeholder={c.telefoon}
            className={inputClass}
            aria-label={c.telefoon}
          />
        </div>
      )}

      {isPartner && step === 2 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm text-muted">{c.qualHint}</p>
          <Check
            label={c.figmaSeat}
            checked={data.figmaSeat}
            onChange={(v) => set('figmaSeat', v)}
            hint={c.figmaNote}
          />
          <Check label={c.bouwtZelf} checked={data.bouwtZelf} onChange={(v) => set('bouwtZelf', v)} />
          {data.bouwtZelf && <Warn text={c.buildWarn} />}
          <Check
            label={c.verkooptHosting}
            checked={data.verkooptHosting}
            onChange={(v) => set('verkooptHosting', v)}
          />
          {data.verkooptHosting && <Warn text={c.hostingWarn} />}
        </div>
      )}

      {isPartner && step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-ink">{c.summary}</p>
          <dl className="flex flex-col gap-2 rounded-xl border border-hair bg-paper p-4 text-sm">
            <Row label={c.studio} value={data.bedrijf} />
            <Row label={c.domein} value={data.domein} />
            <Row label={c.email} value={data.email} />
            <Row label={c.figmaSeat} value={yn(data.figmaSeat)} />
            <Row label={c.bouwtZelf} value={yn(data.bouwtZelf)} />
            <Row label={c.verkooptHosting} value={yn(data.verkooptHosting)} />
          </dl>
          <textarea
            value={data.bericht}
            onChange={(e) => set('bericht', e.target.value)}
            rows={3}
            placeholder={c.partnerBericht}
            className={`${inputClass} resize-y`}
            aria-label={c.partnerBericht}
          />
          {status === 'error' && <p className="text-sm text-red-600">{c.error}</p>}
        </div>
      )}

      {/* ---------------------------- client path ----------------------------- */}

      {!isPartner && step === 1 && (
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

      {!isPartner && step === 2 && (
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

      {!isPartner && step === 3 && (
        <div className="flex flex-col gap-2.5">
          <p className="text-sm text-muted">{c.additionsHint}</p>
          {ADDITIONS.map((a) => (
            <Check
              key={a.value}
              label={locale === 'nl' ? a.nl : a.en}
              checked={data.additions.includes(a.value)}
              onChange={() => toggleAddition(a.value)}
            />
          ))}
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

      {!isPartner && step === 4 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-ink">{c.summary}</p>
          <dl className="flex flex-col gap-2 rounded-xl border border-hair bg-paper p-4 text-sm">
            <Row label={c.bedrijf} value={data.bedrijf} />
            <Row label={c.naam} value={data.naam} />
            <Row label={c.email} value={data.email} />
            <Row label={steps[2]} value={subLabel(data.subscription)} />
            <Row
              label={steps[3]}
              value={
                data.additions
                  .map((v) =>
                    v === 'other' && data.additionsOther ? data.additionsOther : addLabel(v),
                  )
                  .join(', ') || c.none
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

      {/* Navigation. Step 0 has no Next: choosing an audience advances it. */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (step === 1) setAudience('')
            setStep((s) => Math.max(0, s - 1))
          }}
          disabled={step === 0}
          className="rounded-pill px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink disabled:invisible"
        >
          {c.back}
        </button>
        {step === 0 ? (
          <span />
        ) : step < lastStep ? (
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

/** A checkbox styled as a card row, with an optional explanatory line. */
function Check({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  hint?: string
}) {
  return (
    <label
      className={[
        'flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
        checked ? 'border-accent bg-accent-soft' : 'border-hair hover:border-accent/50',
      ].join(' ')}
    >
      <input type="checkbox" checked={checked} onChange={() => onChange(!checked)} className="sr-only" />
      <span
        aria-hidden
        className={[
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all',
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
      <span className="flex flex-col gap-0.5">
        <span className="text-ink">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
    </label>
  )
}

/** An honest heads-up when an answer makes the partnership a poor fit. */
function Warn({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-hair bg-paper px-4 py-3 text-xs leading-relaxed text-muted">
      {text}
    </p>
  )
}

export default OfferteForm
