import type { Scorecard } from './leadlens'

/**
 * Self-service website check — the automated counterpart of LeadLens. A visitor
 * submits their domain on /check; this module probes the site from the Worker,
 * optionally enriches with Google's PageSpeed Insights API, derives the five
 * report grades, composes Dutch findings, and publishes the result to the
 * leadlens-checks R2 bucket under a fresh token — after which the existing
 * /check/<token> page renders it exactly like a LeadLens-authored scorecard.
 *
 * Grading and composition are pure functions (unit-tested); only runSiteCheck
 * touches the network and R2.
 */

// ---- input validation ------------------------------------------------------

/** Accepts bare domains ("kapsalonjan.nl") and full URLs; returns a public https URL. */
export function normalizeCheckUrl(value: string): URL | null {
  const candidate = /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`
  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    return null
  }
  const host = url.hostname.toLowerCase()
  // Public hostnames only. `global_fetch_strictly_public` already guards the
  // deployed Worker; this also covers dev and gives a clean 422 instead.
  if (!host.includes('.')) return null
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return null
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null
  if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan')) return null
  if (url.port && !['80', '443'].includes(url.port)) return null
  return url
}

// ---- probes ----------------------------------------------------------------

export type SiteProbe = {
  reachable: boolean
  /** Final URL after redirects (https). */
  finalUrl?: string
  /** Plain http:// serves content without upgrading to https. */
  httpNotUpgraded: boolean
  headers: {
    hsts: boolean
    csp: boolean
    xfo: boolean
    nosniff: boolean
    referrerPolicy: boolean
  }
  html: {
    title?: string
    siteName?: string
    viewport: boolean
    metaDescription: boolean
    lang: boolean
    generator?: string
    wordpress: boolean
    copyrightYear?: number
  }
  /** Time to first byte of the https GET, in ms. */
  ttfbMs?: number
}

const FETCH_UA =
  'Mozilla/5.0 (compatible; RinslyCheck/1.0; +https://rinsly.com/check) Chrome/140 Safari/537.36'

async function fetchWithTimeout(url: string, ms: number, redirect: 'follow' | 'manual') {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), ms)
  try {
    return await fetch(url, {
      redirect,
      signal: ctl.signal,
      headers: { 'user-agent': FETCH_UA, accept: 'text/html,application/xhtml+xml' },
    })
  } finally {
    clearTimeout(timer)
  }
}

/** Parse the signals we grade on out of a homepage's HTML. */
export function parseHtmlSignals(html: string): SiteProbe['html'] {
  const head = html.slice(0, 200_000)
  const meta = (name: string) =>
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i').exec(head)?.[0]
  const content = (tag?: string) => tag && /content=["']([^"']*)["']/i.exec(tag)?.[1]

  const title = /<title[^>]*>([^<]*)</i.exec(head)?.[1]?.trim() || undefined
  const siteName =
    content(/<meta[^>]+property=["']og:site_name["'][^>]*>/i.exec(head)?.[0])?.trim() || undefined
  const generator = content(meta('generator'))?.trim() || undefined

  // Highest year in a © / &copy; context — a stale year is a classic staleness tell.
  const years = [...html.matchAll(/(?:©|&copy;|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)]
    .map((m) => Number(m[1]))
    .filter((y) => y >= 1995 && y <= 2100)
  const copyrightYear = years.length ? Math.max(...years) : undefined

  return {
    title,
    siteName,
    viewport: /<meta[^>]+name=["']viewport["']/i.test(head),
    metaDescription: Boolean(content(meta('description'))?.trim()),
    lang: /<html[^>]+lang=["'][a-z]{2}/i.test(head),
    generator,
    wordpress: /wp-content|wordpress/i.test(html) || /wordpress/i.test(generator ?? ''),
    copyrightYear,
  }
}

export async function probeSite(url: URL): Promise<SiteProbe> {
  const probe: SiteProbe = {
    reachable: false,
    httpNotUpgraded: false,
    headers: { hsts: false, csp: false, xfo: false, nosniff: false, referrerPolicy: false },
    html: { viewport: false, metaDescription: false, lang: false, wordpress: false },
  }

  let res: Response
  try {
    const started = Date.now()
    res = await fetchWithTimeout(url.href, 20_000, 'follow')
    probe.ttfbMs = Date.now() - started
  } catch {
    return probe
  }
  if (!res.ok) return probe

  probe.reachable = true
  probe.finalUrl = res.url || url.href
  const h = res.headers
  probe.headers = {
    hsts: h.has('strict-transport-security'),
    csp: h.has('content-security-policy'),
    xfo: h.has('x-frame-options') || /frame-ancestors/i.test(h.get('content-security-policy') ?? ''),
    nosniff: (h.get('x-content-type-options') ?? '').toLowerCase().includes('nosniff'),
    referrerPolicy: h.has('referrer-policy'),
  }
  try {
    probe.html = parseHtmlSignals(await res.text())
  } catch {
    // keep defaults — reachability and headers still grade
  }

  // Does plain http:// upgrade to https? Follow redirects and look at the
  // scheme we end up on.
  try {
    const httpRes = await fetchWithTimeout(`http://${url.hostname}/`, 15_000, 'follow')
    probe.httpNotUpgraded = httpRes.ok && new URL(httpRes.url).protocol === 'http:'
  } catch {
    // http closed entirely → fine (not a downgrade risk)
  }

  return probe
}

// ---- PageSpeed Insights (optional enrichment) ------------------------------

export type PsiResult = {
  performance?: number
  seo?: number
  accessibility?: number
  lcpMs?: number
  fcpMs?: number
  tbtMs?: number
}

export async function fetchPsi(url: string, apiKey?: string): Promise<PsiResult | null> {
  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
  endpoint.searchParams.set('url', url)
  endpoint.searchParams.set('strategy', 'mobile')
  for (const c of ['PERFORMANCE', 'SEO', 'ACCESSIBILITY']) endpoint.searchParams.append('category', c)
  if (apiKey) endpoint.searchParams.set('key', apiKey)

  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 75_000)
  try {
    const res = await fetch(endpoint, { signal: ctl.signal })
    if (!res.ok) return null
    const data = (await res.json()) as {
      lighthouseResult?: {
        categories?: Record<string, { score?: number }>
        audits?: Record<string, { numericValue?: number }>
      }
    }
    const lhr = data.lighthouseResult
    if (!lhr?.categories) return null
    const pct = (id: string) => {
      const s = lhr.categories?.[id]?.score
      return typeof s === 'number' ? Math.round(s * 100) : undefined
    }
    const ms = (id: string) => lhr.audits?.[id]?.numericValue
    return {
      performance: pct('performance'),
      seo: pct('seo'),
      accessibility: pct('accessibility'),
      lcpMs: ms('largest-contentful-paint'),
      fcpMs: ms('first-contentful-paint'),
      tbtMs: ms('total-blocking-time'),
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

// ---- grading + composition (pure) ------------------------------------------

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

export function deriveGrades(probe: SiteProbe, psi: PsiResult | null, now = new Date()) {
  const { headers: hd, html } = probe

  let veiligheid = 20 // reachable over https at all
  if (!probe.httpNotUpgraded) veiligheid += 25
  if (hd.hsts) veiligheid += 20
  if (hd.csp) veiligheid += 15
  if (hd.xfo) veiligheid += 10
  if (hd.nosniff) veiligheid += 5
  if (hd.referrerPolicy) veiligheid += 5

  let moderniteit = 40
  if (html.viewport) moderniteit += 20
  if (html.lang) moderniteit += 10
  const yearsStale = html.copyrightYear ? now.getFullYear() - html.copyrightYear : 0
  if (html.copyrightYear && yearsStale <= 1) moderniteit += 20
  else if (yearsStale >= 3) moderniteit -= 10 * Math.min(4, yearsStale - 2)
  if (html.wordpress) moderniteit -= 10
  if (hd.csp || hd.hsts) moderniteit += 10

  // Speed: PSI when available, else a TTFB heuristic (coarse but honest).
  const snelheid =
    psi?.performance ??
    (probe.ttfbMs === undefined ? 50 : probe.ttfbMs < 400 ? 80 : probe.ttfbMs < 1000 ? 65 : probe.ttfbMs < 2500 ? 45 : 25)

  const mobiel = html.viewport
    ? clamp(60 + (psi?.performance ?? 60) * 0.4)
    : clamp(10 + (psi?.performance ?? 0) * 0.1)

  const vindbaarheid =
    psi?.seo ?? clamp(30 + (html.title ? 25 : 0) + (html.metaDescription ? 25 : 0) + (html.lang ? 10 : 0) + (html.viewport ? 10 : 0))

  return {
    moderniteit: clamp(moderniteit),
    snelheid: clamp(snelheid),
    mobiel,
    vindbaarheid,
    veiligheid: clamp(veiligheid),
  }
}

const fmtSec = (ms: number) => `${(ms / 1000).toFixed(1).replace('.', ',')} s`

/** Compose the Dutch findings, worst signals first, max 5 (datacontract). */
export function composeFindings(probe: SiteProbe, psi: PsiResult | null, now = new Date()): string[] {
  const findings: Array<{ weight: number; text: string }> = []
  const add = (weight: number, text: string) => findings.push({ weight, text })

  if (!probe.reachable) {
    return ['de site was tijdens onze controle niet bereikbaar via https, en dat kost u élke bezoeker']
  }

  const { headers: hd, html } = probe
  if (probe.httpNotUpgraded)
    add(95, 'de site is ook bereikbaar via onbeveiligd http://, bezoekers worden niet naar https doorgestuurd')
  if (!html.viewport)
    add(90, 'geen mobiele weergave, terwijl meer dan de helft van uw bezoekers op een telefoon kijkt')
  const yearsStale = html.copyrightYear ? now.getFullYear() - html.copyrightYear : 0
  if (html.copyrightYear && yearsStale >= 2)
    add(80, `het copyrightjaar staat al ${yearsStale} jaar vast op ${html.copyrightYear}. Dat wekt de indruk dat er niemand meer naar de site omkijkt`)
  if (psi?.fcpMs && psi.fcpMs > 3000)
    add(75, `bezoekers kijken ${fmtSec(psi.fcpMs)} naar een leeg scherm voordat er iets verschijnt`)
  if (psi?.lcpMs && psi.lcpMs > 2500)
    add(70, `het belangrijkste beeld is pas na ${fmtSec(psi.lcpMs)} zichtbaar. Google rekent alles boven 2,5 s als traag`)
  if (!psi && probe.ttfbMs !== undefined && probe.ttfbMs > 1000)
    add(70, `de server doet er ${fmtSec(probe.ttfbMs)} over voordat de pagina begint te laden`)
  if (!hd.hsts && !probe.httpNotUpgraded)
    add(45, 'de browserbeveiliging (HSTS) ontbreekt, waardoor verbindingen bij een eerste bezoek te onderscheppen zijn')
  if (!html.metaDescription)
    add(40, 'er is geen meta-omschrijving. Google verzint dan zelf de tekst onder uw zoekresultaat')
  if (!html.title) add(40, 'de pagina heeft geen titel, en dat schaadt de vindbaarheid direct')
  if (html.wordpress && html.generator)
    add(35, `de site draait op ${html.generator}. Verouderde WordPress-installaties zijn het grootste inbraakrisico voor MKB-sites`)
  if (psi?.tbtMs && psi.tbtMs > 300)
    add(30, `scriptwerk blokkeert de pagina ${Math.round(psi.tbtMs)} ms tijdens het laden op mobiel`)

  if (findings.length === 0)
    add(10, 'de technische basis staat er goed bij. De winst zit in de puntjes op de i (snelheid, vindbaarheid, conversie)')

  return findings
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map((f) => f.text)
}

export function composePitch(grades: Scorecard['grades'], probe: SiteProbe): string {
  const worst = Object.entries(grades).sort((a, b) => a[1] - b[1])[0]
  const labels: Record<string, string> = {
    moderniteit: 'een verouderde uitstraling',
    snelheid: 'een trage laadtijd',
    mobiel: 'de mobiele weergave',
    vindbaarheid: 'de vindbaarheid in Google',
    veiligheid: 'de beveiliging',
  }
  if (!probe.reachable) return 'We konden de site niet bereiken. Juist dan is een gesprek zinvol.'
  if (worst[1] >= 65)
    return 'De site staat er technisch goed bij. In een korte kennismaking kijken we graag mee waar nog winst zit.'
  return `Het grootste verbeterpunt is ${labels[worst[0]]}. In een gratis kennismaking laten we zien hoe wij dat oplossen.`
}

// ---- pipeline --------------------------------------------------------------

export type CheckRunStatus = {
  state: 'running' | 'done' | 'error'
  /** Current step, for the progress UI. */
  step: 'probe' | 'psi' | 'compose' | 'done'
  token: string
  startedAt: string
  message?: string
}

export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join('')
}

const STATUS_KEY = (token: string) => `${token}/status.json`

export async function readRunStatus(bucket: R2Bucket, token: string): Promise<CheckRunStatus | null> {
  const obj = await bucket.get(STATUS_KEY(token))
  if (!obj) return null
  try {
    return (await obj.json()) as CheckRunStatus
  } catch {
    return null
  }
}

/**
 * Run the full check and publish the scorecard. Designed to run inside
 * ctx.waitUntil — never throws; failures land in status.json for the poller.
 */
export async function runSiteCheck(opts: {
  bucket: R2Bucket
  token: string
  url: URL
  psiApiKey?: string
  now?: () => Date
}): Promise<void> {
  const { bucket, token, url } = opts
  const now = opts.now ?? (() => new Date())
  const startedAt = now().toISOString()
  const setStatus = (state: CheckRunStatus['state'], step: CheckRunStatus['step'], message?: string) =>
    bucket.put(
      STATUS_KEY(token),
      JSON.stringify({ state, step, token, startedAt, message } satisfies CheckRunStatus),
      { httpMetadata: { contentType: 'application/json' } },
    )

  try {
    await setStatus('running', 'probe')
    const probe = await probeSite(url)

    await setStatus('running', 'psi')
    const psi = probe.reachable ? await fetchPsi(probe.finalUrl ?? url.href, opts.psiApiKey) : null

    await setStatus('running', 'compose')
    const grades = deriveGrades(probe, psi, now())
    const scorecard: Scorecard = {
      version: 1,
      token,
      domain: url.hostname.replace(/^www\./, ''),
      businessName:
        probe.html.siteName ||
        // Split only on a separator with surrounding space, so hyphenated names
        // ("e-invoicing for everyone") survive.
        probe.html.title?.split(/\s+[|–—-]\s+/)[0].trim() ||
        url.hostname.replace(/^www\./, ''),
      grades,
      findings: composeFindings(probe, psi, now()),
      pitch: composePitch(grades, probe),
      createdAt: startedAt,
      expiresAt: new Date(now().getTime() + 90 * 24 * 3600 * 1000).toISOString(),
    }
    await bucket.put(`${token}/scorecard.json`, JSON.stringify(scorecard), {
      httpMetadata: { contentType: 'application/json' },
    })
    // No screenshots in the self-service v1 — the page omits that section.
    await setStatus('done', 'done')
  } catch (err) {
    await setStatus('error', 'compose', err instanceof Error ? err.message : String(err)).catch(() => {})
  }
}
