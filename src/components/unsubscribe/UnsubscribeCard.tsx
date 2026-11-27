import type { ReactNode } from 'react'

import { unsubscribeCopy } from '@/lib/unsubscribeCopy'
import type { UnsubscribeView } from '@/lib/unsubscribePage'
import type { UnsubscribeLocale } from '@/lib/unsubscribeToken'

/**
 * Card for the afmelden page. Uses the same shadow-card / rounded-2xl /
 * border-hair pattern as the offerte and check forms, and the same
 * rinsly-check-circle mark on success. No new styling system.
 */
export function UnsubscribeCard({
  locale,
  view,
  children,
}: {
  locale: UnsubscribeLocale
  view: UnsubscribeView
  children?: ReactNode
}) {
  const copy = unsubscribeCopy(locale)
  const success = view === 'success'
  const cardClass = success
    ? 'shadow-card flex flex-col items-center gap-4 rounded-2xl border border-good/40 bg-card p-6 text-center sm:p-8'
    : 'shadow-card flex flex-col gap-4 rounded-2xl border border-hair bg-card p-6 sm:p-8'

  return (
    <div className={cardClass}>
      {success ? <SuccessCheck /> : null}
      <h1 className="text-lg font-bold tracking-[-0.01em] text-ink sm:text-xl">{copy.title}</h1>
      {view === 'confirm' ? (
        <>
          <p className="text-[17px] leading-relaxed text-muted">{copy.confirm}</p>
          {children}
        </>
      ) : null}
      {view === 'success' ? (
        <>
          <p className="text-[17px] leading-relaxed text-ink">{copy.success}</p>
          <p className="text-sm leading-relaxed text-muted">
            {copy.successFollowUpBefore}
            <a href={copy.successFollowUpHref} className="text-accent underline">
              {copy.successFollowUpLink}
            </a>
            {copy.successFollowUpAfter}
          </p>
          <a
            href={`/${locale}`}
            className="inline-flex min-h-8 items-center text-sm font-semibold text-accent"
          >
            {copy.homeLink}
          </a>
        </>
      ) : null}
      {view === 'invalid' ? (
        <p className="text-[17px] leading-relaxed text-muted">{copy.invalid}</p>
      ) : null}
      {view === 'unavailable' ? (
        <p className="text-[17px] leading-relaxed text-muted">{copy.unavailable}</p>
      ) : null}
    </div>
  )
}

/** Same success mark as the offerte and check-aanvraag forms. */
function SuccessCheck() {
  return (
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
  )
}
