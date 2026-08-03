'use client'

import { useSearchParams } from 'next/navigation'

import { PartnerForm } from './PartnerForm'

/**
 * Reads `?token=…` and hands it to the form.
 *
 * Split out because `useSearchParams` needs a Suspense boundary on a statically
 * exported page — the same reason CheckAanvraagForm splits its ExpiredNotice.
 *
 * No token at all means someone found the page rather than being invited to it.
 * That is not an error worth a scary message: they get told what this is and how
 * to ask for a link.
 */
export function PartnerTokenGate() {
  const token = useSearchParams().get('token') ?? ''

  if (!token) {
    return (
      <div className="rounded-xl border border-hair bg-card px-5 py-4 text-sm text-ink">
        <p className="font-semibold">Deze pagina werkt op uitnodiging.</p>
        <p className="mt-1 text-muted">
          Wij benaderen studio&apos;s waarvan we het werk goed vinden, met een persoonlijke link.
          Denk je dat we jullie over het hoofd hebben gezien? Mail even naar{' '}
          <a className="text-accent underline" href="mailto:contact@rinsly.com">
            contact@rinsly.com
          </a>{' '}
          met een link naar jullie werk.
        </p>
      </div>
    )
  }

  return <PartnerForm token={token} />
}
