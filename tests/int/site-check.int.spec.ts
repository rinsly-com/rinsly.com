// @vitest-environment node
// Unit tests for the self-service website check (src/lib/siteCheck.ts): input
// validation (incl. SSRF-ish hosts), HTML signal parsing, grading and the
// Dutch findings composition. Network/pipeline code is exercised e2e in dev.
import { describe, expect, it } from 'vitest'

import {
  composeFindings,
  deriveGrades,
  generateToken,
  normalizeCheckUrl,
  parseHtmlSignals,
  type SiteProbe,
} from '@/lib/siteCheck'
import { TOKEN_RE, gradeTone, parseScorecard } from '@/lib/leadlens'

const NOW = new Date('2026-07-30T12:00:00Z')

const baseProbe = (over: Partial<SiteProbe> = {}): SiteProbe => ({
  reachable: true,
  finalUrl: 'https://voorbeeld.nl/',
  httpNotUpgraded: false,
  headers: { hsts: true, csp: true, xfo: true, nosniff: true, referrerPolicy: true },
  html: {
    title: 'Voorbeeld BV — loodgieter in Ede',
    viewport: true,
    metaDescription: true,
    lang: true,
    wordpress: false,
    copyrightYear: 2026,
  },
  ttfbMs: 300,
  ...over,
})

describe('normalizeCheckUrl', () => {
  it('accepts bare domains and full URLs', () => {
    expect(normalizeCheckUrl('kapsalonjan.nl')!.href).toBe('https://kapsalonjan.nl/')
    expect(normalizeCheckUrl('  www.uwbedrijf.nl  ')!.hostname).toBe('www.uwbedrijf.nl')
    expect(normalizeCheckUrl('http://site.nl/pagina')!.href).toBe('http://site.nl/pagina')
  })

  it('rejects local, private and non-public targets', () => {
    for (const bad of [
      'localhost',
      'localhost:3000',
      '127.0.0.1',
      '10.0.0.5',
      '172.16.1.1',
      '192.168.1.1',
      '169.254.169.254',
      'router.local',
      'db.internal',
      'https://site.nl:8443',
      'geen spatie.nl valt hier',
      'x',
    ]) {
      expect(normalizeCheckUrl(bad), bad).toBeNull()
    }
  })
})

describe('parseHtmlSignals', () => {
  it('extracts the grading signals', () => {
    const html = `<!doctype html><html lang="nl"><head>
      <title>Kapsalon Jan | Eindhoven</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="De kapper van Eindhoven">
      <meta name="generator" content="WordPress 3.4">
      <meta property="og:site_name" content="Kapsalon Jan">
      </head><body>© 2004-2012 Kapsalon Jan</body></html>`
    const s = parseHtmlSignals(html)
    expect(s.title).toBe('Kapsalon Jan | Eindhoven')
    expect(s.siteName).toBe('Kapsalon Jan')
    expect(s.viewport).toBe(true)
    expect(s.metaDescription).toBe(true)
    expect(s.lang).toBe(true)
    expect(s.wordpress).toBe(true)
    expect(s.copyrightYear).toBe(2012)
  })

  it('handles a bare-bones page', () => {
    const s = parseHtmlSignals('<html><body>hoi</body></html>')
    expect(s.viewport).toBe(false)
    expect(s.title).toBeUndefined()
    expect(s.copyrightYear).toBeUndefined()
  })

  it('finds the copyright year when a name sits between © and the year', () => {
    expect(parseHtmlSignals('<p>© Rinsly 2026 — Alle rechten voorbehouden.</p>').copyrightYear).toBe(2026)
    expect(parseHtmlSignals('<p>Copyright Bakkerij Piet 2019</p>').copyrightYear).toBe(2019)
    expect(parseHtmlSignals('<p>© 2004-2012 Kapsalon Jan</p>').copyrightYear).toBe(2012)
  })
})

describe('deriveGrades', () => {
  it('grades a healthy modern site green across the board', () => {
    const grades = deriveGrades(baseProbe(), { performance: 92, seo: 95 }, NOW)
    for (const [key, score] of Object.entries(grades)) {
      expect(gradeTone(score), `${key}=${score}`).toBe('good')
    }
  })

  it('punishes an ancient unresponsive http site', () => {
    const grades = deriveGrades(
      baseProbe({
        httpNotUpgraded: true,
        headers: { hsts: false, csp: false, xfo: false, nosniff: false, referrerPolicy: false },
        html: {
          title: undefined,
          viewport: false,
          metaDescription: false,
          lang: false,
          wordpress: true,
          copyrightYear: 2012,
        },
        ttfbMs: 3000,
      }),
      null,
      NOW,
    )
    expect(gradeTone(grades.veiligheid)).toBe('low')
    expect(gradeTone(grades.mobiel)).toBe('low')
    expect(gradeTone(grades.moderniteit)).toBe('low')
    expect(gradeTone(grades.snelheid)).toBe('low')
  })

  it('falls back to TTFB when PSI is unavailable', () => {
    expect(deriveGrades(baseProbe({ ttfbMs: 200 }), null, NOW).snelheid).toBe(80)
    expect(deriveGrades(baseProbe({ ttfbMs: 2000 }), null, NOW).snelheid).toBe(45)
  })
})

describe('composeFindings', () => {
  it('caps at 5, worst first, ready-made Dutch', () => {
    const findings = composeFindings(
      baseProbe({
        httpNotUpgraded: true,
        headers: { hsts: false, csp: false, xfo: false, nosniff: false, referrerPolicy: false },
        html: {
          title: undefined,
          viewport: false,
          metaDescription: false,
          lang: false,
          wordpress: true,
          generator: 'WordPress 3.4',
          copyrightYear: 2012,
        },
      }),
      { performance: 20, fcpMs: 4800, lcpMs: 6000, tbtMs: 400 },
      NOW,
    )
    expect(findings).toHaveLength(5)
    expect(findings[0]).toContain('http://')
    expect(findings[1]).toContain('mobiele weergave')
  })

  it('says something kind when nothing is wrong', () => {
    const findings = composeFindings(baseProbe(), { performance: 95, fcpMs: 900, lcpMs: 1400 }, NOW)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toContain('goed')
  })

  it('reports unreachable sites as the single finding', () => {
    const findings = composeFindings(baseProbe({ reachable: false }), null, NOW)
    expect(findings).toHaveLength(1)
    expect(findings[0]).toContain('niet bereikbaar')
  })
})

describe('generateToken', () => {
  it('produces unique tokens that satisfy the page token contract', () => {
    const a = generateToken()
    const b = generateToken()
    expect(a).not.toBe(b)
    expect(TOKEN_RE.test(a)).toBe(true)
  })
})

describe('pipeline output shape', () => {
  it('a composed scorecard passes the /check/<token> parser', () => {
    const probe = baseProbe()
    const grades = deriveGrades(probe, { performance: 70, seo: 80 }, NOW)
    const sc = parseScorecard({
      version: 1,
      token: generateToken(),
      domain: 'voorbeeld.nl',
      businessName: 'Voorbeeld BV',
      grades,
      findings: composeFindings(probe, { performance: 70 }, NOW),
      pitch: 'x',
      createdAt: NOW.toISOString(),
      expiresAt: new Date(NOW.getTime() + 90 * 24 * 3600 * 1000).toISOString(),
    })
    expect(sc).not.toBeNull()
    expect(sc!.findings.length).toBeGreaterThan(0)
  })
})
