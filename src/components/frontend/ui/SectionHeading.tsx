import { Eyebrow } from './Eyebrow'

type HeaderData = {
  eyebrow?: string | null
  title?: string | null
  subtitle?: string | null
  intro?: string | null
} | null | undefined

/**
 * Shared section heading (eyebrow → title → intro), styled from the proposal.
 * `align` centers the block on marketing sections; the default is left.
 */
export function SectionHeading({
  header,
  align = 'left',
  className,
}: {
  header: HeaderData
  align?: 'left' | 'center'
  className?: string
}) {
  if (!header) return null
  const { eyebrow, title, subtitle, intro } = header
  if (!eyebrow && !title && !subtitle && !intro) return null

  const wrap = [
    'flex flex-col gap-3',
    align === 'center' ? 'items-center text-center' : 'items-start',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={wrap}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      {title && (
        <h2 className="text-2xl font-extrabold tracking-[-0.02em] text-ink sm:text-[32px] sm:leading-[1.1]">
          {title}
        </h2>
      )}
      {subtitle && <p className="text-lg font-semibold text-ink">{subtitle}</p>}
      {intro && <p className="max-w-2xl text-[15px] leading-relaxed text-muted">{intro}</p>}
    </div>
  )
}
