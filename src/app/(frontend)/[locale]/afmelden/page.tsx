import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Section } from '@rinsly-com/site-core/ui'

import { UnsubscribeCard } from '@/components/unsubscribe/UnsubscribeCard'
import { UnsubscribeConfirmForm } from '@/components/unsubscribe/UnsubscribeConfirmForm'
import { unsubscribeCopy } from '@/lib/unsubscribeCopy'
import { resolveUnsubscribeDocument } from '@/lib/unsubscribeDocumentStatus'
import { readUnsubscribeTokenSecret } from '@/lib/unsubscribeSecret'
import type { UnsubscribeLocale } from '@/lib/unsubscribeToken'

/**
 * /nl/afmelden and /en/afmelden — marketing mail unsubscribe (human GET).
 *
 * Lives under the locale layout so the normal site header (logo) and footer
 * render. RFC 8058 POST is rewritten to ./one-click (see middleware) so this
 * page and the POST handler can share the public URL. The public rinsly.com
 * site is a static export with no runtime, so this folder is stashed during
 * `build:static` and must be zone-routed to rinsly-accp.
 *
 * noindex: visits come from a mail link, not from search or the sitemap.
 */
export const dynamic = 'force-dynamic'

type Params = { locale: string }

function asLocale(raw: string): UnsubscribeLocale | null {
  if (raw === 'nl' || raw === 'en') return raw
  return null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale) ?? 'nl'
  const copy = unsubscribeCopy(locale)
  return {
    title: copy.title,
    robots: { index: false, follow: false },
  }
}

export default async function AfmeldenPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const locale = asLocale((await params).locale)
  if (locale === null) notFound()

  const rawToken = (await searchParams).token
  const token = typeof rawToken === 'string' ? rawToken : ''

  const lookup = await readUnsubscribeTokenSecret()
  const secret = lookup.state === 'present' ? lookup.secret : ''

  // Friendly body under the locale chrome. Middleware attaches 400/503 with a
  // same-URL rewrite when it could read the secret — App Router pages cannot
  // set those statuses. When middleware could not, the response stays 200 so
  // a confirm form is not hidden behind a 503.
  const { view } = await resolveUnsubscribeDocument(token, secret)

  return (
    <Section className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-16 sm:py-24">
      <div className="w-full max-w-lg">
        {view === 'confirm' ? (
          <UnsubscribeConfirmForm locale={locale} token={token} />
        ) : (
          <UnsubscribeCard locale={locale} view={view} />
        )}
      </div>
    </Section>
  )
}
