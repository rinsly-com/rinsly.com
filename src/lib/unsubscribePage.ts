/**
 * HTML for /{locale}/afmelden. Kept as a string template so GET and POST can
 * share one document from a route handler (RFC 8058 posts to the same URL).
 * The page is noindex, has no email or token in visible text, and uses the
 * site palette with system fonts so it does not depend on the CMS layout.
 */
import { unsubscribeCopy, type UnsubscribeCopy } from './unsubscribeCopy'
import type { UnsubscribeLocale } from './unsubscribeToken'

export type UnsubscribeView = 'confirm' | 'success' | 'invalid' | 'unavailable'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function bodyText(copy: UnsubscribeCopy, view: UnsubscribeView): string {
  if (view === 'confirm') return copy.confirm
  if (view === 'success') return copy.success
  if (view === 'unavailable') return copy.unavailable
  return copy.invalid
}

export function renderUnsubscribePage(options: {
  locale: UnsubscribeLocale
  view: UnsubscribeView
  /** Present only on the confirm view, already verified. */
  token?: string
}): string {
  const { locale, view } = options
  const copy = unsubscribeCopy(locale)
  const message = escapeHtml(bodyText(copy, view))
  const title = escapeHtml(copy.title)
  const action =
    view === 'confirm' && options.token
      ? `/${locale}/afmelden?token=${encodeURIComponent(options.token)}`
      : null
  const form = action
    ? `
    <form method="post" action="${escapeHtml(action)}">
      <input type="hidden" name="token" value="${escapeHtml(options.token ?? '')}" />
      <input type="hidden" name="confirm" value="1" />
      <button type="submit">${escapeHtml(copy.button)}</button>
    </form>
    <p><a href="/${locale}">${escapeHtml(copy.cancel)}</a></p>`
    : ''

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <meta name="referrer" content="no-referrer" />
  <title>${title} — Rinsly</title>
  <style>
    :root {
      --paper: #f4f7f9;
      --ink: #14212e;
      --muted: #566573;
      --accent: #226887;
      --accent-ink: #ffffff;
      --hair: #dfe6eb;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --paper: #0e1922;
        --ink: #e8eff4;
        --muted: #8fa1b0;
        --accent: #6cbbe0;
        --accent-ink: #14212e;
        --hair: #24384a;
      }
    }
    html, body { margin: 0; background: var(--paper); color: var(--ink);
      font: 18px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    main { max-width: 36rem; margin: 0 auto; padding: 4rem 1.25rem 5rem; }
    h1 { font-size: 1.75rem; letter-spacing: -0.025em; margin: 0 0 1rem; }
    p { color: var(--muted); margin: 0 0 1.5rem; }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: var(--accent-ink);
      font: inherit; font-weight: 650; padding: 0.7rem 1.25rem; cursor: pointer;
    }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${message}</p>${form}
  </main>
</body>
</html>
`
}
