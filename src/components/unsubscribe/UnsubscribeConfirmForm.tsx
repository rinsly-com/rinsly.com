import { unsubscribeCopy } from '@/lib/unsubscribeCopy'
import type { UnsubscribeLocale } from '@/lib/unsubscribeToken'

import { UnsubscribeCard } from './UnsubscribeCard'

/**
 * Human confirm form. A native POST to the public /{locale}/afmelden URL,
 * so it records the opt-out without JavaScript (AVG 7(3)). Middleware
 * rewrites the POST to ./one-click; one-click already accepts confirm=1
 * plus the token. Do not wrap this in a client server-action callback:
 * without JS that becomes a GET and never writes.
 */
export function UnsubscribeConfirmForm({
  locale,
  token,
}: {
  locale: UnsubscribeLocale
  token: string
}) {
  const copy = unsubscribeCopy(locale)
  const action = `/${locale}/afmelden?token=${encodeURIComponent(token)}`

  return (
    <UnsubscribeCard locale={locale} view="confirm">
      <form className="flex flex-wrap items-center gap-3" method="post" action={action}>
        <input type="hidden" name="token" value={token} />
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
