/**
 * HTML for RFC 8058 POST responses (mail clients post to the same URL).
 * The human GET/confirm page is the React panel under the site header and
 * footer. This document stays noindex and never includes a recipient email.
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

function followUpHtml(copy: UnsubscribeCopy): string {
  return `${escapeHtml(copy.successFollowUpBefore)}<a href="${escapeHtml(copy.successFollowUpHref)}">${escapeHtml(copy.successFollowUpLink)}</a>${escapeHtml(copy.successFollowUpAfter)}`
}

export function renderUnsubscribePage(options: {
  locale: UnsubscribeLocale
  view: UnsubscribeView
  /** Present only on the confirm view, already verified. */
  token?: string
}): string {
  const { locale, view } = options
  const copy = unsubscribeCopy(locale)
  const title = escapeHtml(copy.title)
  const action =
    view === 'confirm' && options.token
      ? `/${locale}/afmelden?token=${encodeURIComponent(options.token)}`
      : null

  let body: string
  if (view === 'confirm' && action) {
    body = `<p>${escapeHtml(copy.confirm)}</p>
    <div class="actions">
      <form method="post" action="${escapeHtml(action)}">
        <input type="hidden" name="token" value="${escapeHtml(options.token ?? '')}" />
        <input type="hidden" name="confirm" value="1" />
        <button type="submit">${escapeHtml(copy.button)}</button>
      </form>
      <a class="cancel" href="/${locale}">${escapeHtml(copy.cancel)}</a>
    </div>`
  } else if (view === 'success') {
    body = `<p>${escapeHtml(copy.success)}</p>
    <p>${followUpHtml(copy)}</p>
    <p><a href="/${locale}">${escapeHtml(copy.homeLink)}</a></p>`
  } else if (view === 'unavailable') {
    body = `<p>${escapeHtml(copy.unavailable)}</p>`
  } else {
    body = `<p>${escapeHtml(copy.invalid)}</p>`
  }

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
    .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: var(--accent-ink);
      font: inherit; font-weight: 650; padding: 0.7rem 1.25rem; cursor: pointer;
    }
    a { color: var(--accent); text-decoration: underline; }
    a.cancel { display: inline-flex; align-items: center; min-height: 32px; }
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    ${body}
  </main>
</body>
</html>
`
}
