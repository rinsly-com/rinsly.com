import { ImageResponse } from 'next/og'

/**
 * Social card for /check (plan 002 B-08): the brand and the page's existing
 * name, no claims and no numbers. Static: rendered once at build time.
 */
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
// Static in both builds: no data, and `output: export` (build:static) needs an explicit static route.
export const dynamic = 'force-static'
export const alt = 'Gratis websitecheck · Rinsly'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#14212E',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Rinsly
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', width: 96, height: 8, background: '#2c7ea8', borderRadius: 4 }} />
          <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Gratis websitecheck
          </div>
        </div>
      </div>
    ),
    size,
  )
}
