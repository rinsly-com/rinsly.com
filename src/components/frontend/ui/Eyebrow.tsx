import type { ReactNode } from 'react'

/**
 * Small uppercase accent label above section titles (from the proposal's
 * `.eyebrow` / section-heading style).
 */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  const classes = [
    'text-xs font-bold uppercase tracking-[0.14em] text-accent',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return <p className={classes}>{children}</p>
}
