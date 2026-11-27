'use client'

import { useState } from 'react'

import { confirmUnsubscribeAction } from '@/lib/unsubscribeAction'
import { unsubscribeCopy } from '@/lib/unsubscribeCopy'
import type { UnsubscribeView } from '@/lib/unsubscribePage'
import type { UnsubscribeLocale } from '@/lib/unsubscribeToken'

import { UnsubscribeCard } from './UnsubscribeCard'

export function UnsubscribeConfirmForm({
  locale,
  token,
}: {
  locale: UnsubscribeLocale
  token: string
}) {
  const copy = unsubscribeCopy(locale)
  const [view, setView] = useState<UnsubscribeView>('confirm')

  if (view !== 'confirm') {
    return <UnsubscribeCard locale={locale} view={view} />
  }

  return (
    <UnsubscribeCard locale={locale} view="confirm">
      {/* String action so SSR keeps method=post when JavaScript is off. */}
      <form
        className="flex flex-wrap items-center gap-3"
        method="post"
        action={`/${locale}/afmelden?token=${encodeURIComponent(token)}`}
        onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          void confirmUnsubscribeAction(formData).then(setView)
        }}
      >
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="confirm" value="1" />
        <button
          type="submit"
          className="inline-flex items-center rounded-pill bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
        >
          {copy.button}
        </button>
        <a
          href={`/${locale}`}
          className="inline-flex min-h-8 items-center text-sm font-semibold text-accent transition-opacity hover:opacity-80"
        >
          {copy.cancel}
        </a>
      </form>
    </UnsubscribeCard>
  )
}
