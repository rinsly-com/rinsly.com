import type { ReactNode } from 'react'

export type Locale = 'nl' | 'en'
export type BlockRenderer = (block: unknown, locale: Locale) => ReactNode
