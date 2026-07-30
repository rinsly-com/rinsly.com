'use client'

import { useEffect, useRef, useState } from 'react'

// Empty on accp (same origin); the static rinsly.com build inlines the accp API
// origin — same wiring as the other public forms. The final scorecard link uses
// the same base so it works before the rinsly.com/check/* zone route exists.
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')

const inputClass =
  'w-full rounded-lg border border-hair bg-paper px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted focus:border-accent'

const looksLikeSite = (value: string) => /.\../.test(value.trim())

/** Progress steps, in pipeline order (matches CheckRunStatus.step). */
const STEPS = [
  { key: 'probe', label: 'Bereikbaarheid & beveiliging controleren' },
  { key: 'psi', label: 'Snelheid en mobiel meten (via Google)' },
  { key: 'compose', label: 'Uw persoonlijke rapport samenstellen' },
] as const

type Phase =
  | { kind: 'idle' }
  | { kind: 'running'; token: string; step: string }
  | { kind: 'done'; token: string }
  | { kind: 'error'; message: string }

/**
 * The self-service checker: domain in → live progress → redirect to the
 * freshly generated /check/<token> scorecard. Failures point at the manual
 * form below as fallback.
 */
export function CheckRunner() {
  const [url, setUrl] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current)
  }, [])

  async function start(e: React.FormEvent) {
    e.preventDefault()
    if (phase.kind === 'running' || !looksLikeSite(url)) return
    setPhase({ kind: 'running', token: '', step: 'probe' })
    try {
      const res = await fetch(`${API_BASE}/api/check-run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, bedrijfsnaam: honeypot }),
      })
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; token?: string; error?: string }
      if (!res.ok || !body.ok || !body.token) {
        setPhase({
          kind: 'error',
          message:
            body.error === 'rate_limited'
              ? 'U heeft het maximum aantal checks voor dit uur bereikt. Probeer het later nog eens, of laat uw gegevens achter via het formulier hieronder.'
              : body.error === 'validation'
                ? 'Dat lijkt geen geldig websiteadres. Controleer de spelling (bijv. www.uwbedrijf.nl).'
                : 'De check kon niet worden gestart. Probeer het nog eens, of gebruik het formulier hieronder.',
        })
        return
      }
      const token = body.token
      setPhase({ kind: 'running', token, step: 'probe' })

      const startedAt = Date.now()
      pollRef.current = setInterval(async () => {
        if (Date.now() - startedAt > 150_000) {
          if (pollRef.current) clearInterval(pollRef.current)
          setPhase({ kind: 'error', message: 'De check duurt langer dan verwacht. Laat uw gegevens achter via het formulier hieronder — dan kijken wij er persoonlijk naar.' })
          return
        }
        try {
          const s = await fetch(`${API_BASE}/api/check-run/status?token=${token}`)
          if (s.status === 404) return // status.json not written yet — keep waiting
          const data = (await s.json().catch(() => ({}))) as {
            ok?: boolean
            status?: { state: string; step: string }
          }
          if (!data.ok || !data.status) return
          if (data.status.state === 'done') {
            if (pollRef.current) clearInterval(pollRef.current)
            setPhase({ kind: 'done', token })
            window.location.href = `${API_BASE}/check/${token}`
          } else if (data.status.state === 'error') {
            if (pollRef.current) clearInterval(pollRef.current)
            setPhase({ kind: 'error', message: 'We konden de site niet volledig beoordelen. Laat uw gegevens achter via het formulier hieronder — dan kijken wij er persoonlijk naar.' })
          } else {
            setPhase({ kind: 'running', token, step: data.status.step })
          }
        } catch {
          // transient network hiccup — the next poll retries
        }
      }, 2500)
    } catch {
      setPhase({ kind: 'error', message: 'De check kon niet worden gestart. Probeer het nog eens, of gebruik het formulier hieronder.' })
    }
  }

  if (phase.kind === 'running' || phase.kind === 'done') {
    const activeIndex =
      phase.kind === 'done' ? STEPS.length : STEPS.findIndex((s) => s.key === phase.step)
    return (
      <div className="shadow-card rounded-2xl border border-hair bg-card p-6 sm:p-8" aria-live="polite">
        <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">
          We testen {url.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}…
        </h2>
        <p className="mt-1 text-sm text-muted">Dit duurt meestal een halve minuut.</p>
        <ol className="mt-6 flex flex-col gap-4">
          {STEPS.map((step, i) => {
            const state = i < activeIndex ? 'done' : i === activeIndex ? 'busy' : 'todo'
            return (
              <li key={step.key} className="flex items-center gap-3 text-[15px]">
                {state === 'done' ? (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-good/15 font-extrabold text-good">
                    ✓
                  </span>
                ) : state === 'busy' ? (
                  <span
                    aria-hidden
                    className="size-7 shrink-0 animate-spin rounded-full border-2 border-accent-soft border-t-accent"
                  />
                ) : (
                  <span className="size-7 shrink-0 rounded-full border-2 border-hair" />
                )}
                <span className={state === 'todo' ? 'text-muted' : 'text-ink'}>{step.label}</span>
              </li>
            )
          })}
        </ol>
        {phase.kind === 'done' && (
          <p className="mt-6 text-sm font-semibold text-good">
            Klaar! We sturen u door naar uw rapport…
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="shadow-card rounded-2xl border border-hair bg-card p-6 sm:p-8">
      <form onSubmit={start} noValidate className="flex flex-col gap-4">
        <input
          type="text"
          name="bedrijfsnaam"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Uw websiteadres
          <input
            type="url"
            name="url"
            required
            placeholder="bijv. www.uwbedrijf.nl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={inputClass}
          />
        </label>
        {phase.kind === 'error' && (
          <p className="rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-ink" role="alert">
            {phase.message}
          </p>
        )}
        <button
          type="submit"
          disabled={!looksLikeSite(url)}
          data-magnetic=""
          className="inline-flex items-center justify-center gap-2 self-start rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Test mijn website nu
        </button>
        <p className="text-xs text-muted">
          Direct resultaat, geen gegevens nodig. We bewaren alleen het domein en het rapport.
        </p>
      </form>
    </div>
  )
}
