import Link from 'next/link'

import { ArrowIcon } from './ArrowIcon'

type ButtonProps = {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
  newTab?: boolean
  className?: string
}

/**
 * Brand button (server-safe). Primary is an accent pill with white text;
 * secondary is a bare accent text link. Both end in a small right arrow.
 */
export function Button({ label, href, variant = 'primary', newTab, className }: ButtonProps) {
  const base = 'inline-flex items-center gap-2 text-sm font-semibold'
  const styles =
    variant === 'primary'
      ? `${base} rounded-pill bg-accent px-6 py-3 text-white transition-opacity hover:opacity-90`
      : `${base} text-accent transition-opacity hover:opacity-80`

  return (
    <Link
      href={href}
      className={className ? `${styles} ${className}` : styles}
      {...(variant === 'primary' ? { 'data-magnetic': '' } : {})}
      {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {label}
      <ArrowIcon />
    </Link>
  )
}
