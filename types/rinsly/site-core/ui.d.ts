import type { ReactNode } from 'react'

import type { Locale } from './index'

export type SectionHeader = {
  eyebrow?: string | null
  title?: string | null
  subtitle?: string | null
  intro?: string | null
}

type HeadingProps = {
  header?: SectionHeader | null
  className?: string
  children?: ReactNode
}

export function Section(props: { className?: string; children?: ReactNode }): ReactNode
export function SectionHeading(props: HeadingProps): ReactNode
export function Eyebrow(props: { children?: ReactNode; className?: string }): ReactNode
export function Icon(props: {
  name: string
  fallback?: string
  size?: number
  stroke?: number
  className?: string
}): ReactNode
export function ArrowIcon(props: { className?: string }): ReactNode

export type LinkFields = {
  label: string
  variant?: 'primary' | 'secondary' | null
  type?: 'internal' | 'external' | null
  page?: number | null
  url?: string | null
  anchor?: string | null
  newTab?: boolean | null
  id?: string | null
}

export function Buttons(props: {
  buttons?: LinkFields[] | null
  locale?: Locale
  className?: string
}): ReactNode

export type TurnstileHandle = { reset: () => void }

export function Turnstile(props: {
  className?: string
  action?: string
  locale?: string
  onToken?: (token: string | null) => void
  onReady?: (handle: TurnstileHandle) => void
}): ReactNode

/** Real package returns a class instance; object-spreading it is a lint error. */
export class TurnstileHeaders {
  readonly token: string
  constructor(token: string) {
    this.token = token
  }
}
export function turnstileHeaders(token: string | null): TurnstileHeaders
