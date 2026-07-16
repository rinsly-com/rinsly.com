import type { ReactNode } from 'react'

type SectionProps = {
  children: ReactNode
  className?: string
  id?: string
}

/**
 * Standard section wrapper: centers content at a comfortable document width
 * (matching the proposal's ~1080px reading measure) with responsive padding.
 */
export function Section({ children, className, id }: SectionProps) {
  const classes = ['mx-auto w-full max-w-[1080px] px-5 sm:px-8', className]
    .filter(Boolean)
    .join(' ')

  return (
    <section id={id} className={classes}>
      {children}
    </section>
  )
}
