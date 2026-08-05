import type { Locale } from '@rinsly-com/site-core'
import { Section, SectionHeading } from '@rinsly-com/site-core/ui'

/**
 * The `diagram` block's renderer: schematics drawn as inline SVG.
 *
 * Why SVG in code rather than uploaded images:
 *  - **Theme-aware.** Everything is painted with `currentColor` or the token
 *    classes (`text-ink`, `text-muted`, `text-accent`, `text-hair`), so the same
 *    drawing works in light and dark without exporting twice.
 *  - **Accessible.** Each figure is a `<figure>` with a real `<figcaption>`, and
 *    the SVG carries `role="img"` + `aria-label`, so the caption is the
 *    description rather than decoration.
 *  - **Responsive.** A `viewBox` with no fixed width scales down; the wrapper
 *    scrolls horizontally below the point where labels would collide, so the page
 *    body never scrolls sideways.
 *
 * Adding a diagram: a new `kind` option in `src/blocks/Diagram.ts` and a case
 * here. Keep them mechanism drawings — what actually happens — not decoration.
 */

type Kind = 'figmaToProduction' | 'oneEngineFleet' | 'invoicingRoutes'

type Props = {
  kind?: Kind | string | null
  eyebrow?: string | null
  title?: string | null
  caption?: string | null
  locale: Locale
}

type FigmaLabels = { a: string; aSub: string; b: string; bSub: string; c: string; cSub: string }
type FleetLabels = { engine: string; fix: string; sites: string; release: string }
type RouteLabels = {
  a: string
  b: string
  client: string
  partner: string
  rinsly: string
  list: string
  net: string
  share: string
  own: string
  agreement: string
}

const T: Record<'nl' | 'en', { figma: FigmaLabels; fleet: FleetLabels; routes: RouteLabels }> = {
  nl: {
    figma: { a: 'Figma-bestand', aSub: 'Dev Mode', b: 'Rinsly bouwt', bSub: 'getypeerde app op de engine', c: 'Live site', cSub: 'edge · CMS · back-ups' },
    fleet: { engine: '@rinsly-com/site-core', fix: 'één fix', sites: 'elke klantsite', release: 'één release' },
    routes: {
      a: 'Rinsly factureert',
      b: 'Partner factureert',
      client: 'eindklant',
      partner: 'partner',
      rinsly: 'Rinsly',
      list: '€249 lijstprijs',
      net: '€199,20 (min 20%)',
      share: '€49,80 aandeel',
      own: 'eigen prijs',
      agreement: 'overeenkomst: altijd Rinsly ⟷ eindklant',
    },
  },
  en: {
    figma: { a: 'Figma file', aSub: 'Dev Mode', b: 'Rinsly builds', bSub: 'typed app on the engine', c: 'Live site', cSub: 'edge · CMS · backups' },
    fleet: { engine: '@rinsly-com/site-core', fix: 'one fix', sites: 'every client site', release: 'one release' },
    routes: {
      a: 'Rinsly invoices',
      b: 'Partner invoices',
      client: 'end client',
      partner: 'partner',
      rinsly: 'Rinsly',
      list: '€249 list',
      net: '€199.20 (less 20%)',
      share: '€49.80 share',
      own: 'their own price',
      agreement: 'agreement: always Rinsly ⟷ end client',
    },
  },
}

/** A rounded node. `accent` marks the one Rinsly operates. */
function Node({
  x,
  y,
  w = 150,
  h = 54,
  label,
  sub,
  accent = false,
}: {
  x: number
  y: number
  w?: number
  h?: number
  label: string
  sub?: string
  accent?: boolean
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={11}
        className={accent ? 'fill-accent/10 stroke-accent' : 'fill-card stroke-hair'}
        strokeWidth={1.5}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 3 : y + h / 2 + 4}
        textAnchor="middle"
        className={accent ? 'fill-accent text-[12.5px] font-bold' : 'fill-ink text-[12.5px] font-semibold'}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 14}
          textAnchor="middle"
          className="fill-muted text-[10.5px]"
        >
          {sub}
        </text>
      )}
    </g>
  )
}

/** A horizontal arrow with an optional label above it. */
function Arrow({ x1, x2, y, label }: { x1: number; x2: number; y: number; label?: string }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 7} y2={y} className="stroke-hair" strokeWidth={1.5} />
      <path
        d={`M${x2 - 7},${y - 4} L${x2},${y} L${x2 - 7},${y + 4}`}
        className="fill-none stroke-hair"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {label && (
        <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" className="fill-muted text-[10.5px]">
          {label}
        </text>
      )}
    </g>
  )
}

function FigmaToProduction({ t }: { t: FigmaLabels }) {
  return (
    <svg viewBox="0 0 640 100" role="img" aria-hidden="true" className="w-full min-w-[560px]">
      <Node x={0} y={23} label={t.a} sub={t.aSub} />
      <Arrow x1={155} x2={240} y={50} />
      <Node x={245} y={23} label={t.b} sub={t.bSub} accent />
      <Arrow x1={400} x2={485} y={50} />
      <Node x={490} y={23} label={t.c} sub={t.cSub} />
    </svg>
  )
}

function OneEngineFleet({ t }: { t: FleetLabels }) {
  const sites = [0, 1, 2, 3]
  const siteW = 128
  const gap = 42
  const totalW = sites.length * siteW + (sites.length - 1) * gap
  return (
    <svg viewBox="0 0 700 190" role="img" aria-hidden="true" className="w-full min-w-[620px]">
      {/* the engine */}
      <Node x={(700 - 300) / 2} y={0} w={300} h={54} label={t.engine} sub={t.fix} accent />
      {/* one release fans out */}
      <text x={350} y={82} textAnchor="middle" className="fill-muted text-[10.5px]">
        {t.release}
      </text>
      {sites.map((i) => {
        const cx = (700 - totalW) / 2 + i * (siteW + gap) + siteW / 2
        return (
          <g key={i}>
            <path
              d={`M350,58 C350,80 ${cx},78 ${cx},112`}
              className="fill-none stroke-hair"
              strokeWidth={1.5}
            />
            <path
              d={`M${cx - 4},105 L${cx},112 L${cx + 4},105`}
              className="fill-none stroke-hair"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )
      })}
      {sites.map((i) => (
        <Node
          key={i}
          x={(700 - totalW) / 2 + i * (siteW + gap)}
          y={114}
          w={siteW}
          h={44}
          label={`site ${i + 1}`}
        />
      ))}
      <text x={350} y={180} textAnchor="middle" className="fill-muted text-[10.5px]">
        {t.sites}
      </text>
    </svg>
  )
}

function InvoicingRoutes({ t }: { t: RouteLabels }) {
  return (
    <svg viewBox="0 0 660 250" role="img" aria-hidden="true" className="w-full min-w-[580px]">
      {/* Route A */}
      <text x={0} y={12} className="fill-ink text-[11.5px] font-bold">
        A · {t.a}
      </text>
      <Node x={0} y={24} w={130} h={46} label={t.rinsly} accent />
      <Arrow x1={135} x2={250} y={47} label={t.list} />
      <Node x={255} y={24} w={130} h={46} label={t.client} />
      <path
        d="M65,72 C65,96 470,96 470,52"
        className="fill-none stroke-hair"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      <path
        d="M466,59 L470,52 L474,59"
        className="fill-none stroke-hair"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Node x={405} y={24} w={130} h={46} label={t.partner} />
      <text x={470} y={106} textAnchor="middle" className="fill-muted text-[10.5px]">
        {t.share}
      </text>

      {/* Route B */}
      <text x={0} y={148} className="fill-ink text-[11.5px] font-bold">
        B · {t.b}
      </text>
      <Node x={0} y={160} w={130} h={46} label={t.rinsly} accent />
      <Arrow x1={135} x2={250} y={183} label={t.net} />
      <Node x={255} y={160} w={130} h={46} label={t.partner} />
      <Arrow x1={390} x2={505} y={183} label={t.own} />
      <Node x={510} y={160} w={130} h={46} label={t.client} />

      {/* what never moves */}
      <text x={0} y={238} className="fill-muted text-[10.5px] italic">
        {t.agreement}
      </text>
    </svg>
  )
}

export function Diagram({ kind, eyebrow, title, caption, locale }: Props) {
  const t = T[locale === 'en' ? 'en' : 'nl']

  const drawing =
    kind === 'oneEngineFleet' ? (
      <OneEngineFleet t={t.fleet} />
    ) : kind === 'invoicingRoutes' ? (
      <InvoicingRoutes t={t.routes} />
    ) : (
      <FigmaToProduction t={t.figma} />
    )

  return (
    <Section className="py-12 sm:py-16">
      <SectionHeading header={{ eyebrow, title }} />
      <figure className={eyebrow || title ? 'mt-7' : undefined} data-reveal>
        {/* The drawing scrolls inside its own box rather than widening the page. */}
        <div
          role="group"
          aria-label={caption ?? undefined}
          className="overflow-x-auto rounded-2xl border border-hair bg-card p-6 sm:p-8"
        >
          {drawing}
        </div>
        {caption && (
          <figcaption className="mt-3 max-w-[70ch] text-xs leading-relaxed text-muted">
            {caption}
          </figcaption>
        )}
      </figure>
    </Section>
  )
}

export default Diagram
