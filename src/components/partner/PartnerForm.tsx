'use client'

import { useEffect, useState } from 'react'

// Empty on accp (same origin). The static rinsly.com build inlines the accp API
// origin (NEXT_PUBLIC_API_URL) and posts cross-origin, same as the check forms.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')

const inputClass =
  'w-full rounded-lg border border-hair bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent'

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim())

/**
 * The three responsibilities, and what each is worth.
 *
 * The percentages are duplicated here from Ledger's tenantRate.ts, which is a
 * real cost — but a partner deciding what to take on has to see the number next
 * to the commitment, and the alternative (an API call to a local SQLite file
 * that is not on the internet) does not exist. If the model changes, this list
 * and the contract generator change with it.
 */
const DUTIES = {
  nl: [
    {
      key: 'exclusiviteit' as const,
      pct: 10,
      title: 'Exclusiviteit',
      blurb:
        'Nieuw werk breng je bij ons onder. Klanten die al ergens anders draaien mogen blijven tot een grote update, of tot hun hostingcontract daar afloopt: dan bied je ons opnieuw aan.',
    },
    {
      key: 'relatiebeheer' as const,
      pct: 5,
      title: 'Relatiebeheer',
      blurb:
        'Jij bent het aanspreekpunt van je klant en reageert hem inhoudelijk binnen een week. Wat technisch werk vraagt, meld je per e-mail aan ons. Wij nemen geen direct contact op met jouw klanten.',
    },
    {
      key: 'marketing' as const,
      pct: 5,
      title: 'Marketing',
      blurb: 'Een vaste vermelding op je eigen site, en Rinsly genoemd in elk voorstel waar hosting in voorkomt.',
    },
  ],
  en: [
    {
      key: 'exclusiviteit' as const,
      pct: 10,
      title: 'Exclusivity',
      blurb:
        'New work comes to us. Clients already hosted elsewhere may stay until a big update, or until their hosting contract elsewhere comes up for renewal: at that point you offer us again.',
    },
    {
      key: 'relatiebeheer' as const,
      pct: 5,
      title: 'Relation & first-line support',
      blurb:
        'You are your client\u2019s point of contact and reply to them within a week. Whatever needs our technical work, you email us. We do not contact your clients directly.',
    },
    {
      key: 'marketing' as const,
      pct: 5,
      title: 'Marketing',
      blurb: 'A standing mention on your own site, and Rinsly named in every proposal that includes hosting.',
    },
  ],
} as const

const T = {
  nl: {
    checking: 'Even je link controleren…',
    expired: 'Deze link is verlopen.',
    broken: 'Deze link werkt niet.',
    expiredBody:
      'Uitnodigingen verlopen na een tijdje. Mail ons even, dan sturen we een nieuwe.',
    brokenBody:
      'Misschien is er iets misgegaan met kopiëren. Mail ons de link even, dan zoeken we het uit.',
    doneTitle: 'Dank je, we hebben alles binnen.',
    doneBody:
      'We nemen het door en bellen je om het af te stemmen. Daarna sturen we het contract, met precies de verantwoordelijkheden die je hier hebt gekozen.',
    dutiesLegend: 'Wat wil je oppakken?',
    dutiesIntro:
      'De basis is 0%. Elke verantwoordelijkheid die je op je neemt verhoogt je aandeel in de doorlopende omzet. Daarbovenop komen de omzetniveaus: boven €1.000 per maand +5%, boven €5.000 +10%, boven €25.000 +15%.',
    rateLabel: 'Jouw tarief bij aanvang',
    zeroNote:
      'Zonder verantwoordelijkheden staat het tarief op 0%. Dat mag: je kunt je ook eerst aanmelden en later kiezen.',
    detailsLegend: 'Jullie gegevens',
    company: 'Bedrijfsnaam',
    contact: 'Contactpersoon',
    email: 'E-mail',
    phone: 'Telefoon',
    address: 'Adres',
    city: 'Plaats',
    kvk: 'KvK-nummer',
    vat: 'Btw-nummer',
    whereLegend: 'Waar werk je?',
    branches: 'Branches',
    branchesHint: "Komma's ertussen. Leeg = alles.",
    branchesPlaceholder: 'kapper, restaurant, tandarts',
    languages: 'Talen',
    languagesHint: 'Waarin je een klantgesprek voert.',
    countries: 'Landen',
    countriesHint: 'Waar je klanten zitten.',
    figmaTitle: 'We hebben Figma met Dev Mode',
    figmaBlurb:
      'Ontwerpen leveren we in Figma aan. Heb je het nog niet, vink dit dan niet aan, dan bespreken we het gewoon.',
    note: 'Nog iets dat we moeten weten?',
    invalid: 'Vul in ieder geval je bedrijfsnaam en een geldig e-mailadres in.',
    failed: 'Er ging iets mis bij het versturen. Probeer het nog eens, of mail ons op',
    submit: 'Versturen',
    submitting: 'Versturen…',
    disclaimer:
      'Dit is een aanmelding, nog geen overeenkomst. We bellen je om het door te nemen en sturen daarna pas een contract.',
  },
  en: {
    checking: 'Just checking your link…',
    expired: 'This link has expired.',
    broken: 'This link does not work.',
    expiredBody: 'Invitations expire after a while. Drop us a line and we will send a fresh one.',
    brokenBody:
      'Something may have gone wrong copying it. Send us the link and we will sort it out.',
    doneTitle: 'Thanks, we have everything.',
    doneBody:
      'We will go through it and call you to confirm. After that we send the contract, with exactly the responsibilities you picked here.',
    dutiesLegend: 'What do you want to take on?',
    dutiesIntro:
      'The base is 0%. Every responsibility you take on raises your share of the recurring revenue. On top of that come the revenue levels: above €1.000 a month +5%, above €5.000 +10%, above €25.000 +15%.',
    rateLabel: 'Your rate at the start',
    zeroNote:
      'With no responsibilities the rate is 0%. That is fine: you can sign up first and choose later.',
    detailsLegend: 'Your details',
    company: 'Company name',
    contact: 'Contact person',
    email: 'E-mail',
    phone: 'Phone',
    address: 'Address',
    city: 'City',
    kvk: 'Chamber of Commerce no.',
    vat: 'VAT number',
    whereLegend: 'Where do you work?',
    branches: 'Branches',
    branchesHint: 'Comma-separated. Empty = any.',
    branchesPlaceholder: 'hairdresser, restaurant, dentist',
    languages: 'Languages',
    languagesHint: 'The ones you can hold a client call in.',
    countries: 'Countries',
    countriesHint: 'Where your clients are.',
    figmaTitle: 'We have Figma with Dev Mode',
    figmaBlurb:
      'Designs are delivered in Figma. If you do not have it yet, leave this unticked, we will just talk it through.',
    note: 'Anything else we should know?',
    invalid: 'Please give at least your company name and a valid e-mail address.',
    failed: 'Something went wrong sending this. Try again, or mail us at',
    submit: 'Send',
    submitting: 'Sending…',
    disclaimer:
      'This is an application, not yet an agreement. We will call you to go through it and only then send a contract.',
  },
} as const

export interface Prefill {
  domein: string
  bedrijfsnaam: string
  plaats: string
  land: string
}

type Fields = {
  bedrijfsnaam: string
  contactpersoon: string
  email: string
  telefoon: string
  adres: string
  plaats: string
  kvk: string
  btwNummer: string
  branches: string
  talen: string
  landen: string
  opmerking: string
  exclusiviteit: boolean
  relatiebeheer: boolean
  marketing: boolean
  figmaSeat: boolean
  /** Honeypot — hidden from people, irresistible to bots. */
  website: string
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

/**
 * The self-configuration form behind a signed invite link.
 *
 * What makes this more than a contact form is the middle section: the studio
 * picks which responsibilities they want, and that is what sets their rate. The
 * running total is shown live, because the whole proposition — 0% base, every
 * point bought with a commitment — only lands if you can watch the number move.
 *
 * It is explicitly an application. The copy says so, and Rinsly reviews it in
 * Ledger before anything is agreed.
 */
export function PartnerForm({ token, locale = 'nl' }: { token: string; locale?: 'nl' | 'en' }) {
  const t = T[locale]
  const duties = DUTIES[locale]
  const [state, setState] = useState<'checking' | 'invalid' | 'ready' | 'sending' | 'done' | 'error'>(
    'checking',
  )
  const [reason, setReason] = useState<string>('')
  const [f, setF] = useState<Fields>({
    bedrijfsnaam: '',
    contactpersoon: '',
    email: '',
    telefoon: '',
    adres: '',
    plaats: '',
    kvk: '',
    btwNummer: '',
    branches: '',
    talen: 'nl',
    landen: 'nl',
    opmerking: '',
    exclusiviteit: false,
    relatiebeheer: false,
    marketing: false,
    figmaSeat: false,
    website: '',
  })
  const [touched, setTouched] = useState(false)

  // Check the link before showing a form that would fail on submit.
  useEffect(() => {
    let cancelled = false
    if (!token) {
      setState('invalid')
      setReason('missing')
      return
    }
    fetch(`${API_BASE}/api/partner-aanvraag/verify?token=${encodeURIComponent(token)}`)
      .then((r) => r.json() as Promise<{ ok: boolean; reason?: string; prefill?: Prefill }>)
      .then((body) => {
        if (cancelled) return
        if (!body.ok || !body.prefill) {
          setState('invalid')
          setReason(body.reason ?? 'malformed')
          return
        }
        setF((prev) => ({
          ...prev,
          bedrijfsnaam: body.prefill!.bedrijfsnaam,
          plaats: body.prefill!.plaats,
          talen: body.prefill!.land || 'nl',
          landen: body.prefill!.land || 'nl',
        }))
        setState('ready')
      })
      .catch(() => {
        if (!cancelled) {
          setState('invalid')
          setReason('network')
        }
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const pct =
    (f.exclusiviteit ? 10 : 0) + (f.relatiebeheer ? 5 : 0) + (f.marketing ? 5 : 0)
  const valid = isEmail(f.email) && f.bedrijfsnaam.trim() !== ''

  const set =
    (key: keyof Fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((d) => ({ ...d, [key]: e.target.value }))

  const toggle = (key: keyof Fields) => () => setF((d) => ({ ...d, [key]: !d[key] }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!valid || state === 'sending') return
    setState('sending')
    try {
      const res = await fetch(`${API_BASE}/api/partner-aanvraag`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...f, token }),
      })
      const body = (await res.json()) as { ok: boolean }
      setState(body.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  if (state === 'checking') {
    return <p className="text-sm text-muted">{t.checking}</p>
  }

  if (state === 'invalid') {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent-soft px-5 py-4 text-sm text-ink">
        <p className="font-semibold">
          {reason === 'expired' ? t.expired : t.broken}
        </p>
        <p className="mt-1 text-muted">
          {reason === 'expired' ? t.expiredBody : t.brokenBody}{' '}
          <a className="text-accent underline" href="mailto:contact@rinsly.com">
            contact@rinsly.com
          </a>
        </p>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="rounded-xl border border-good/40 bg-accent-soft px-5 py-4 text-sm text-ink">
        <p className="font-semibold">{t.doneTitle}</p>
        <p className="mt-1 text-muted">{t.doneBody}</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      {/* ── what you take on ─────────────────────────────────────────── */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-ink">{t.dutiesLegend}</legend>
        <p className="text-sm text-muted">{t.dutiesIntro}</p>
        {duties.map((d) => {
          const on = f[d.key]
          return (
            <button
              type="button"
              key={d.key}
              onClick={toggle(d.key)}
              aria-pressed={on}
              className={`flex w-full gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                on ? 'border-accent bg-accent-soft' : 'border-hair bg-paper hover:border-accent/50'
              }`}
            >
              <span
                aria-hidden
                className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border text-xs font-bold ${
                  on ? 'border-accent bg-accent text-white' : 'border-hair text-transparent'
                }`}
              >
                ✓
              </span>
              <span className="min-w-0">
                <span className="flex items-baseline gap-2">
                  <span className="font-semibold text-ink">{d.title}</span>
                  <span className="text-sm font-bold text-accent">+{d.pct}%</span>
                </span>
                <span className="mt-0.5 block text-sm text-muted">{d.blurb}</span>
              </span>
            </button>
          )
        })}
        <div className="flex items-baseline justify-between rounded-xl border border-hair bg-card px-4 py-3">
          <span className="text-sm font-medium text-ink">{t.rateLabel}</span>
          <span className="text-2xl font-extrabold tabular-nums text-accent">{pct}%</span>
        </div>
        {pct === 0 && (
          <p className="text-sm text-muted">{t.zeroNote}</p>
        )}
      </fieldset>

      {/* ── who you are ──────────────────────────────────────────────── */}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold text-ink">{t.detailsLegend}</legend>
        <Field label={t.company}>
          <input className={inputClass} value={f.bedrijfsnaam} onChange={set('bedrijfsnaam')} />
        </Field>
        <Field label={t.contact}>
          <input className={inputClass} value={f.contactpersoon} onChange={set('contactpersoon')} />
        </Field>
        <Field label={t.email}>
          <input
            className={inputClass}
            type="email"
            value={f.email}
            onChange={set('email')}
            aria-invalid={touched && !isEmail(f.email)}
          />
        </Field>
        <Field label={t.phone}>
          <input className={inputClass} value={f.telefoon} onChange={set('telefoon')} />
        </Field>
        <Field label={t.address}>
          <input className={inputClass} value={f.adres} onChange={set('adres')} />
        </Field>
        <Field label={t.city}>
          <input className={inputClass} value={f.plaats} onChange={set('plaats')} />
        </Field>
        <Field label={t.kvk}>
          <input className={inputClass} value={f.kvk} onChange={set('kvk')} />
        </Field>
        <Field label={t.vat}>
          <input className={inputClass} value={f.btwNummer} onChange={set('btwNummer')} />
        </Field>
      </fieldset>

      {/* ── how we should match you ──────────────────────────────────── */}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-semibold text-ink">{t.whereLegend}</legend>
        <Field label={t.branches} hint={t.branchesHint}>
          <input
            className={inputClass}
            value={f.branches}
            onChange={set('branches')}
            placeholder={t.branchesPlaceholder}
          />
        </Field>
        <Field label={t.languages} hint={t.languagesHint}>
          <input className={inputClass} value={f.talen} onChange={set('talen')} placeholder="nl, de" />
        </Field>
        <Field label={t.countries} hint={t.countriesHint}>
          <input className={inputClass} value={f.landen} onChange={set('landen')} placeholder="nl, be" />
        </Field>
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={toggle('figmaSeat')}
            aria-pressed={f.figmaSeat}
            className={`flex w-full gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
              f.figmaSeat ? 'border-accent bg-accent-soft' : 'border-hair bg-paper'
            }`}
          >
            <span
              aria-hidden
              className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border text-xs font-bold ${
                f.figmaSeat ? 'border-accent bg-accent text-white' : 'border-hair text-transparent'
              }`}
            >
              ✓
            </span>
            <span>
              <span className="font-semibold text-ink">{t.figmaTitle}</span>
              <span className="mt-0.5 block text-sm text-muted">{t.figmaBlurb}</span>
            </span>
          </button>
        </div>
        <div className="sm:col-span-2">
          <Field label={t.note}>
            <textarea className={inputClass} rows={4} value={f.opmerking} onChange={set('opmerking')} />
          </Field>
        </div>
      </fieldset>

      {/* Honeypot: off-screen, not display:none, so bots still fill it. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
        </label>
      </div>

      {touched && !valid && (
        <p className="text-sm text-red-500">{t.invalid}</p>
      )}
      {state === 'error' && (
        <p className="text-sm text-red-500">
          {t.failed}{' '}
          <a className="underline" href="mailto:contact@rinsly.com">
            contact@rinsly.com
          </a>
          .
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === 'sending'}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {state === 'sending' ? t.submitting : t.submit}
        </button>
        <p className="text-xs text-muted">{t.disclaimer}</p>
      </div>
    </form>
  )
}
