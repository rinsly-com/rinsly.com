import { createElement, type ComponentType } from 'react'
import * as TablerIcons from '@tabler/icons-react'

type TablerIconProps = {
  size?: number | string
  stroke?: number | string
  className?: string
  color?: string
  'aria-hidden'?: boolean
}

// The named exports of @tabler/icons-react are all `Icon*` React components.
// Indexing by a runtime string keeps the whole set available; since this module
// is only imported by server components, the barrel stays server-side and the
// selected SVG is inlined into the statically-exported HTML (no icon JS ships).
const icons = TablerIcons as unknown as Record<string, ComponentType<TablerIconProps> | undefined>

export type IconProps = {
  /** Tabler component name from the CMS IconSelector, e.g. "IconHeart". */
  name?: string | null
  /** Tabler component name to use when `name` is empty or unknown. */
  fallback?: string
  className?: string
  size?: number
  stroke?: number
}

/**
 * Renders a Tabler icon by its component name.
 *
 * Server component: the resolved SVG is inlined into the build-time HTML, so no
 * icon code is shipped to the browser even though the CMS can pick from the full
 * Tabler library. Renders `fallback` when `name` is unset or unknown, and
 * nothing when neither resolves — matching the field's optional-with-fallback
 * behaviour.
 */
export function Icon({ name, fallback, className, size = 24, stroke = 2 }: IconProps) {
  const cmp = resolve(name) ?? resolve(fallback)
  if (!cmp) return null
  // createElement (not JSX with a local capitalised var) renders the resolved
  // icon without tripping react-hooks/static-components.
  return createElement(cmp, { size, stroke, className, 'aria-hidden': true })
}

function resolve(name?: string | null): ComponentType<TablerIconProps> | undefined {
  if (!name) return undefined
  return icons[name]
}
