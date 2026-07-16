import { ImageResponse } from 'next/og'

import type { Page } from '@/payload-types'
import { cfImageSrc } from './image'
import { SITE_URL } from './siteUrl'

/**
 * Open Graph image rendering, shared by the `opengraph-image` routes. Every
 * page gets a branded 1200×630 card generated from its title; editors can
 * override it per page by uploading `meta.image` (SEO plugin).
 */
export const OG_SIZE = { width: 1200, height: 630 }
export const OG_CONTENT_TYPE = 'image/png'

const ACCENT = '#2C7EA8'
const SLATE = '#14212E'

/** Absolute, render-time-reachable URL for a page's `meta.image` override. */
export function metaImageUrl(page: Page | null | undefined): string | undefined {
  const image = (page as { meta?: { image?: unknown } } | null | undefined)?.meta?.image
  if (!image || typeof image !== 'object') return undefined
  const url = (image as { url?: string | null }).url
  if (!url) return undefined
  const absolute = new URL(url, SITE_URL).toString()
  return cfImageSrc(absolute, { width: OG_SIZE.width, fit: 'cover', quality: 90 })
}

export function renderOgImage({
  title,
  eyebrow = 'Webontwikkeling & hosting',
  imageUrl,
}: {
  title: string
  eyebrow?: string
  imageUrl?: string | null
}): ImageResponse {
  if (imageUrl) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            width={OG_SIZE.width}
            height={OG_SIZE.height}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            alt=""
          />
        </div>
      ),
      OG_SIZE,
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: 88,
          background: SLATE,
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: ACCENT,
          }}
        >
          Rinsly
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 980 }}>
            {title}
          </div>
          <div
            style={{
              display: 'flex',
              width: 140,
              height: 12,
              marginTop: 36,
              borderRadius: 999,
              background: ACCENT,
            }}
          />
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.72)' }}>{eyebrow}</div>
      </div>
    ),
    OG_SIZE,
  )
}
