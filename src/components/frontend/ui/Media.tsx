import type { CSSProperties } from 'react'

import type { Media as MediaDoc } from '@/payload-types'
import { cfImageSrc, cfImageSrcSet, type ImageTransform } from '@/lib/image'

/** An upload field value: a populated Media doc (depth ≥ 1), an id, or empty. */
export type MediaResource = number | MediaDoc | null | undefined

/** Narrow an upload field to its populated Media doc, else null. */
export function resolveMedia(resource: MediaResource): MediaDoc | null {
  return resource && typeof resource === 'object' ? resource : null
}

/**
 * Resolve an upload field directly to its URL (depth ≥ 1), else null. In
 * production the URL is rewritten through Cloudflare Image Transformations;
 * pass `transform` (e.g. `{ width: 1600 }`) when you know the rendered size.
 * Use this for `background-image`/single `<img src>` cases; prefer <Media>
 * (which also emits a responsive srcset) for regular images.
 */
export function mediaUrl(resource: MediaResource, transform?: ImageTransform): string | null {
  const url = resolveMedia(resource)?.url
  return url ? cfImageSrc(url, transform) : null
}

type MediaProps = {
  /** The upload field value (Media doc, id, or null). */
  resource: MediaResource
  /** Overrides the doc's `alt`. Pass "" for decorative images. */
  alt?: string
  /** Classes for the <img> box (sizing/position). Do NOT set object-fit here. */
  className?: string
  /** How the image fills its box. Defaults to "cover". */
  fit?: 'cover' | 'contain'
  style?: CSSProperties
  /**
   * Hardcoded image path used when `resource` is empty (e.g. a design default
   * shipped in /public). Lets a block render its default until an editor
   * uploads a replacement in the CMS. Served as-is (not transformed).
   */
  fallbackSrc?: string
  /**
   * The image's rendered width across breakpoints, for the responsive `srcset`
   * (the HTML `sizes` attribute). Defaults to `100vw`. Set this to the box's
   * real width (e.g. `(min-width: 768px) 560px, 100vw`) so the browser doesn't
   * over-fetch. Only affects CMS media, not `fallbackSrc`.
   */
  sizes?: string
}

/**
 * Renders a CMS media upload as an <img>, applying the doc's focal point as
 * CSS `object-position`. Because the crop is done by the browser (object-fit +
 * object-position), focal-point framing works everywhere — local dev, the accp
 * Worker, and the static production export — with no `sharp` on the Worker.
 *
 * In production the image URL is rewritten through Cloudflare Image
 * Transformations (see src/lib/image.ts): the browser gets a responsive
 * `srcset` of edge-resized AVIF/WebP variants. In dev the plain original is
 * served (transforms only run on a Cloudflare zone).
 *
 * The caller sizes the box via `className` (e.g. `absolute inset-0 size-full`);
 * this component owns `object-fit`/`object-position`. Server component: the URL
 * and focal style are inlined into the static HTML, shipping no client JS.
 */
export function Media({
  resource,
  alt,
  className,
  fit = 'cover',
  style,
  fallbackSrc,
  sizes = '100vw',
}: MediaProps) {
  const media = resolveMedia(resource)
  const rawSrc = media?.url ?? fallbackSrc
  if (!rawSrc) return null

  // Route CMS media through Cloudflare Image Transformations (resize + AVIF/WebP
  // via a responsive srcset); a design default in /public is served as-is.
  const isCmsMedia = Boolean(media?.url)
  const src = isCmsMedia ? cfImageSrc(rawSrc, { width: 1600 }) : rawSrc
  const srcSet = isCmsMedia ? cfImageSrcSet(rawSrc) : undefined

  // Payload stores the focal point as 0–100 percentages, which map directly to
  // object-position; default to centre when unset (and for the fallback image).
  const x = media?.focalX ?? 50
  const y = media?.focalY ?? 50

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt ?? media?.alt ?? ''}
      className={className}
      style={{ objectFit: fit, objectPosition: `${x}% ${y}%`, ...style }}
    />
  )
}

export default Media
