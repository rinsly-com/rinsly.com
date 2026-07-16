/**
 * Cloudflare Image Transformations helper.
 *
 * Media originals live in R2 and are served by the Payload worker at
 * `/api/media/file/<filename>` (see the r2Storage adapter in payload.config.ts).
 * In production we rewrite those URLs through Cloudflare's `/cdn-cgi/image/`
 * endpoint so each image is resized and re-encoded (AVIF/WebP) at the edge — no
 * sharp, and the browser only downloads a variant sized for its viewport.
 *
 * `/cdn-cgi/image/` only works on a Cloudflare zone with Image Transformations
 * enabled, so we gate on the site origin being https. In local dev
 * (http://localhost) the URL is returned untouched and served same-origin.
 */
const MEDIA_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const CAN_TRANSFORM = MEDIA_ORIGIN.startsWith('https://')

export type ImageTransform = {
  /** Target width in CSS pixels. Omit to leave the width untouched. */
  width?: number
  /** Output quality 1–100. */
  quality?: number
  /**
   * How the image is fitted to `width` (Cloudflare `fit`). Defaults to
   * `scale-down`, which never upscales and preserves aspect ratio.
   */
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad'
}

/**
 * Rewrite a media URL to a Cloudflare Image Transformations URL. Returns the URL
 * unchanged when transforms are unavailable (dev / same-origin worker preview).
 */
export function cfImageSrc(
  url: string,
  { width, quality = 82, fit = 'scale-down' }: ImageTransform = {},
): string {
  if (!CAN_TRANSFORM) return url
  const abs = new URL(url, MEDIA_ORIGIN)
  const opts = ['format=auto', `quality=${quality}`, `fit=${fit}`]
  if (width) opts.push(`width=${width}`)
  return `${abs.origin}/cdn-cgi/image/${opts.join(',')}${abs.pathname}${abs.search}`
}

// Widths mirror Next.js' default deviceSizes: enough steps for the browser to
// pick a sharp variant on any viewport / DPR without generating dozens of them.
const SRCSET_WIDTHS = [640, 828, 1200, 1600, 2048, 3840]

/**
 * Build a `srcset` of Cloudflare variants at a range of widths so the browser
 * downloads one matched to its rendered size. Returns undefined when transforms
 * are unavailable (a bare `src` is used instead).
 */
export function cfImageSrcSet(
  url: string,
  opts: Omit<ImageTransform, 'width'> = {},
): string | undefined {
  if (!CAN_TRANSFORM) return undefined
  return SRCSET_WIDTHS.map((w) => `${cfImageSrc(url, { ...opts, width: w })} ${w}w`).join(', ')
}
