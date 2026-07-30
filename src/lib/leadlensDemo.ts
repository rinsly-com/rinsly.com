import type { ScorecardResult } from './leadlens'

/**
 * Dev-only demo lead for /check/demo — lets you review the scorecard page
 * design without seeding the R2 bucket. Strictly `next dev`: in production
 * builds the token behaves like any unknown token (redirect to /check).
 */
export const DEMO_TOKEN = 'demo'

export const demoEnabled = () => process.env.NODE_ENV === 'development'

export const demoScorecard = (): ScorecardResult => ({
  status: 'ok',
  scorecard: {
    version: 1,
    token: DEMO_TOKEN,
    domain: 'kapsalonjan.nl',
    businessName: 'Kapsalon Jan',
    niche: 'kapper',
    city: 'Eindhoven',
    grades: { moderniteit: 50, snelheid: 83, mobiel: 10, vindbaarheid: 83, veiligheid: 15 },
    findings: [
      'copyrightjaar staat al 14 jaar vast op 2012',
      'geen mobiele weergave, de site stamt van vóór het smartphone-tijdperk',
      "geen HTTPS: browsers markeren de site als 'niet veilig'",
      'trage laadtijd: bezoekers wachten ruim 6 seconden op de homepage',
    ],
    pitch: 'De site draait nog op WordPress 3.4 uit 2012 en heeft geen HTTPS…',
    createdAt: '2026-07-29T09:00:00Z',
    // No expiresAt: the demo never expires.
  },
  screenshots: { desktop: true, mobile: true },
})

/** Branded SVG placeholders so the screenshot section renders without R2 objects. */
export function demoScreenshotSvg(kind: 'desktop' | 'mobile'): string {
  const [w, h] = kind === 'desktop' ? [1440, 900] : [390, 624]
  const label = kind === 'desktop' ? 'Desktopweergave (voorbeeld)' : 'Mobiel (voorbeeld)'
  const fontSize = kind === 'desktop' ? 40 : 20
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4f7f9"/>
      <stop offset="1" stop-color="#dfe6eb"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="0" y="0" width="${w}" height="${Math.round(h * 0.09)}" fill="#152b3c"/>
  <rect x="${Math.round(w * 0.08)}" y="${Math.round(h * 0.2)}" width="${Math.round(w * 0.5)}" height="${Math.round(h * 0.06)}" rx="6" fill="#c8d4dc"/>
  <rect x="${Math.round(w * 0.08)}" y="${Math.round(h * 0.32)}" width="${Math.round(w * 0.84)}" height="${Math.round(h * 0.4)}" rx="10" fill="#ffffff"/>
  <text x="50%" y="${Math.round(h * 0.55)}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${fontSize}" fill="#566573">${label}</text>
  <text x="50%" y="${Math.round(h * 0.55) + fontSize * 1.6}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="${Math.round(fontSize * 0.7)}" fill="#8fa1b0">kapsalonjan.nl</text>
</svg>`
}
