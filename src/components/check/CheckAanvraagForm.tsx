'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

// Empty on accp (same origin). The static rinsly.com build inlines the accp API
// origin (NEXT_PUBLIC_API_URL) and the form posts cross-origin (CORS-allowed) —
// the same wiring as the OfferteForm quote wizard.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')

const inputClass =
  'w-full rounded-lg border border-hair bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent'

const isPhone = (value: string) => value.replace(/[^\d]/g, '').length >= 8
const looksLikeSite = (value: string) => /.\../.test(value.trim())

/**
 * Reads `?link=verlopen` (set when a personal /check/<token> link is unknown or
 * expired) and shows the notice from handoff §2C. useSearchParams needs a
 * Suspense boundary on the statically exported page, hence the split component.
 */
function ExpiredNotice() {
  const params = useSearchParams()
  if (params.get('link') !== 'verlopen') return null
  return (
    <div
      role="status"
      className="mb-5 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-ink"
    >
      Deze persoonlijke link is verlopen. Vraag hieronder een nieuwe gratis beoordeling aan. We
      sturen u binnen één werkdag een verse scorecard.
    </div>
  )
}

/**
 * Lead form for the generic /check page: website + naam + telefoonnummer.
 * Submissions land in the `check-aanvragen` collection for sales follow-up.
 */
export function CheckAanvraagForm() {
  const [data, setData] = useState({ url: '', naam: '', telefoon: '', bedrijfsnaam: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [touched, setTouched] = useState(false)

  const valid = looksLikeSite(data.url) && data.naam.trim() !== '' && isPhone(data.telefoon)

  const set = (key: keyof typeof data) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [key]: e.target.value }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!valid || status === 'submitting') return
    setStatus('submitting')
    try {
      const res = await fetch(`${API_BASE}/api/check-aanvraag`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean }
      setStatus(res.ok && body.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="shadow-card flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-good/40 bg-card p-8 text-center">
        <span className="rinsly-check-circle mx-auto flex size-16 items-center justify-center rounded-full bg-good text-white">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
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
        <h2 className="text-lg font-bold text-ink">Aanvraag ontvangen</h2>
        <p className="max-w-sm text-sm text-ink">
          Bedankt! We bekijken uw website en nemen binnen één werkdag contact met u op.
        </p>
      </div>
    )
  }

  return (
    <div className="shadow-card rounded-2xl border border-hair bg-card p-6 sm:p-8">
      <Suspense fallback={null}>
        <ExpiredNotice />
      </Suspense>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {/* Honeypot — hidden from real visitors; bots that fill it are ignored. */}
        <input
          type="text"
          name="bedrijfsnaam"
          value={data.bedrijfsnaam}
          onChange={set('bedrijfsnaam')}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Uw website
          <input
            type="url"
            name="url"
            required
            placeholder="bijv. www.uwbedrijf.nl"
            value={data.url}
            onChange={set('url')}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Uw naam
          <input
            type="text"
            name="naam"
            required
            autoComplete="name"
            placeholder="Voor- en achternaam"
            value={data.naam}
            onChange={set('naam')}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Telefoonnummer
          <input
            type="tel"
            name="telefoon"
            required
            autoComplete="tel"
            placeholder="bijv. 06 12 34 56 78"
            value={data.telefoon}
            onChange={set('telefoon')}
            className={inputClass}
          />
        </label>
        {touched && !valid && status !== 'submitting' && (
          <p className="text-sm text-muted" role="alert">
            Vul uw websiteadres, naam en telefoonnummer in, dan kunnen we u bereiken.
          </p>
        )}
        {status === 'error' && (
          <p className="text-sm font-semibold text-ink" role="alert">
            Er ging iets mis bij het versturen. Probeer het nog eens, of mail ons op{' '}
            <a href="mailto:contact@rinsly.com" className="text-accent underline">
              contact@rinsly.com
            </a>
            .
          </p>
        )}
        <button
          type="submit"
          disabled={status === 'submitting'}
          data-magnetic=""
          className="inline-flex items-center justify-center gap-2 self-start rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === 'submitting' ? 'Versturen…' : 'Vraag de gratis check aan'}
        </button>
        <p className="text-xs text-muted">
          We gebruiken uw gegevens alleen om contact op te nemen over uw websitecheck.
        </p>
      </form>
    </div>
  )
}
