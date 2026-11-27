/**
 * Decorative frames for the product-led blocks: a browser window holding a
 * small example layout, a phone with a CMS edit view, and the step frames.
 * CSS only (no images). The only words inside them (the phone's save button,
 * the Live/Staging labels, v8) come from the block's CMS fields; everything
 * else is bars, not copy. The overlay chip and the caption are rendered by
 * the block itself. All sizes are fixed or come from
 * normal flow, so nothing shifts when RinslyMotion animates them (transform
 * and opacity only).
 */
import type { ReactNode } from 'react'

const bar = (w: string, tone = 'bg-hair', h = 'h-1.5') => <span className={`block ${h} rounded-full ${tone}`} style={{ width: w }} />

export function BrowserFrame({ url, children, className }: { url?: string | null; children: ReactNode; className?: string }) {
  return (
    <div className={['relative overflow-hidden rounded-2xl border border-hair bg-card shadow-card', className].filter(Boolean).join(' ')}>
      <div className="flex items-center gap-2 border-b border-hair bg-paper px-3 py-2">
        <span aria-hidden className="flex gap-1">
          <i className="block size-2 rounded-full bg-hair" />
          <i className="block size-2 rounded-full bg-hair" />
          <i className="block size-2 rounded-full bg-hair" />
        </span>
        <span className="flex h-5 flex-1 items-center truncate rounded-md border border-hair bg-card px-2.5 text-[11px] text-muted">
          {url}
        </span>
      </div>
      {children}
    </div>
  )
}

/** Home: a business site (nav, a two-line headline, brand art, three cards with an icon, a button). v8 mockup. */
export function MiniBusinessSite() {
  return (
    <div aria-hidden className="flex h-full flex-col gap-2 bg-paper py-3 pr-[96px] pl-3.5">
      <div className="flex items-center gap-2">
        <span className="block size-2.5 shrink-0 rounded-[3px] bg-accent" />
        {bar('22px', 'bg-hair', 'h-[5px]')}
        {bar('22px', 'bg-hair', 'h-[5px]')}
        {bar('22px', 'bg-hair', 'h-[5px]')}
      </div>
      <div className="flex flex-col gap-[5px] pt-1">
        {bar('72%', 'bg-ink/90', 'h-[9px]')}
        {bar('48%', 'bg-ink/70', 'h-[9px]')}
        {bar('36%', 'bg-muted/40', 'h-1.5')}
      </div>
      <div className="relative h-[72px] shrink-0 overflow-hidden rounded-[10px] bg-gradient-to-br from-accent-soft via-accent-soft to-accent/70">
        <span className="absolute -top-6 -right-3.5 block size-24 rounded-full bg-card/45" />
        <span className="absolute bottom-3 left-5 block h-9 w-14 rotate-[16deg] rounded-xl bg-slate/20" />
        <span className="absolute top-6 left-4 block h-2 w-[34%] rounded-full bg-card/80" />
      </div>
      <div className="grid grid-cols-3 gap-[7px]">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex flex-col gap-[5px] rounded-lg border border-hair bg-card px-[7px] pt-[7px] pb-2">
            <i className="block size-2 rounded-full bg-accent/85" />
            {bar('78%', 'bg-hair', 'h-[5px]')}
            {bar('52%', 'bg-hair/70', 'h-1')}
          </span>
        ))}
      </div>
      <span className="block h-3.5 w-[52px] rounded-pill bg-accent" />
    </div>
  )
}

/**
 * Prijzen (v8): a live and a staging window of the same site, one above the
 * other (no second price list). The two labels are CMS content
 * (showcase.liveLabel / stagingLabel); without a label the window is drawn alone.
 */
export function MiniEnvironments({ liveLabel, stagingLabel }: { liveLabel?: string | null; stagingLabel?: string | null }) {
  return (
    <div aria-hidden className="flex h-full flex-col gap-2 bg-paper px-3 pt-2.5">
      <EnvWindow label={liveLabel} />
      <EnvWindow label={stagingLabel} staging />
    </div>
  )
}

function EnvWindow({ label, staging = false }: { label?: string | null; staging?: boolean }) {
  return (
    <div>
      {label && <p className="mb-1 ml-px text-[10px] leading-none font-bold tracking-[0.08em] text-accent-strong uppercase">{label}</p>}
      <div className="overflow-hidden rounded-lg border border-hair bg-card">
        <div className="flex items-center gap-[3px] border-b border-hair bg-paper px-1.5 py-1">
          <i className="block size-1 rounded-full bg-hair" />
          <i className="block size-1 rounded-full bg-hair" />
          <i className="block size-1 rounded-full bg-hair" />
          <span className="ml-1 block h-2 flex-1 rounded-[3px] border border-hair bg-card" />
        </div>
        <div className={['flex flex-col gap-[5px] px-[7px] pt-1.5 pb-[7px]', staging ? 'opacity-90' : ''].join(' ')}>
          <div className="flex items-center gap-[5px]">
            <span className="block size-[7px] rounded-[2px] bg-accent" />
            {bar('14px', 'bg-hair', 'h-1')}
            {bar('14px', 'bg-hair', 'h-1')}
          </div>
          <div
            className={[
              'relative h-6 overflow-hidden rounded-[5px]',
              staging
                ? 'bg-[repeating-linear-gradient(135deg,var(--accent-soft)_0_5px,color-mix(in_srgb,var(--accent-soft)_60%,var(--card))_5px_8px)]'
                : 'bg-gradient-to-br from-accent-soft via-accent-soft to-accent/70',
            ].join(' ')}
          >
            {!staging && <span className="absolute -top-5 -right-2 block size-16 rounded-full bg-card/45" />}
            <span className="absolute bottom-1 left-3 block h-1.5 w-[34%] rounded-full bg-card/80" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="block h-3 rounded-[3px] border border-hair bg-card" />
            <span className={['block h-3 rounded-[3px] border bg-card', staging ? 'border-dashed border-muted/50 bg-transparent' : 'border-hair'].join(' ')} />
            <span className={['block h-3 rounded-[3px] border bg-card', staging ? 'border-dashed border-muted/50 bg-transparent' : 'border-hair'].join(' ')} />
          </div>
        </div>
      </div>
    </div>
  )
}

/** Prijzen: a plan dashboard (side rail, four plan tiles with one highlighted, a usage meter). */
export function MiniPlanDashboard() {
  return (
    <div aria-hidden className="grid h-full grid-cols-[52px_1fr] bg-paper">
      <div className="flex flex-col gap-2 bg-slate p-2.5">
        <span className="mb-1 block size-3 rounded-sm bg-accent" />
        {bar('100%', 'bg-slate-ink/25')}
        {bar('80%', 'bg-slate-ink/25')}
        {bar('90%', 'bg-slate-ink/25')}
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          {bar('34%', 'bg-ink/80', 'h-2.5')}
          {bar('18%', 'bg-accent/60', 'h-2')}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={[
                'flex h-[86px] flex-col gap-1.5 rounded-lg border bg-card p-2',
                i === 1 ? 'border-accent ring-1 ring-accent' : 'border-hair',
              ].join(' ')}
            >
              {bar('55%', i === 1 ? 'bg-accent' : 'bg-ink/60')}
              {bar('70%', 'bg-ink/80', 'h-2.5')}
              <span className="mt-auto flex flex-col gap-1">{bar('90%')}{bar('70%')}</span>
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg border border-hair bg-card p-2.5">
          {bar('30%', 'bg-ink/60')}
          <span className="block h-2 overflow-hidden rounded-full bg-accent-soft">
            <span className="block h-full w-[38%] rounded-full bg-accent/70" />
          </span>
        </div>
      </div>
    </div>
  )
}

/** Partner: a design studio's portfolio site (big type, a work grid of three pieces). v8 mockup. */
export function MiniStudioPortfolio() {
  return (
    <div aria-hidden className="flex h-full flex-col gap-2 bg-paper p-3.5">
      <div className="flex items-center gap-2">
        <span className="block size-2.5 shrink-0 rounded-[3px] bg-accent" />
        {bar('22px', 'bg-hair', 'h-[5px]')}
        {bar('22px', 'bg-hair', 'h-[5px]')}
        {bar('22px', 'bg-hair', 'h-[5px]')}
      </div>
      <div className="flex flex-col gap-[5px] pt-1">
        {bar('78%', 'bg-ink/90', 'h-3')}
        {bar('52%', 'bg-ink/70', 'h-3')}
      </div>
      <div className="grid flex-1 grid-cols-[1.35fr_1fr] gap-[7px]">
        <span className="relative block overflow-hidden rounded-lg bg-gradient-to-br from-slate via-slate to-accent">
          <span className="absolute -top-2.5 -right-2 block size-[46px] rounded-full bg-card/25" />
        </span>
        <span className="flex flex-col gap-[7px]">
          <span className="relative block flex-1 overflow-hidden rounded-lg bg-gradient-to-br from-accent/40 via-accent-soft to-accent-soft">
            <span className="absolute top-2 left-2 block size-7 rounded-md bg-accent/30" />
          </span>
          <span className="relative block flex-1 overflow-hidden rounded-lg bg-gradient-to-br from-accent/70 to-accent-soft">
            <span className="absolute -top-2.5 -right-2 block size-[46px] rounded-full bg-card/30" />
          </span>
        </span>
      </div>
    </div>
  )
}

/**
 * Home only (v8): a phone with a mobile CMS. Thin bezel, a camera dot (no
 * notch), status bar, app bar (back, title, avatar), stacked fields with one
 * in edit state (selection and caret), image thumbnails, and a sticky save
 * button. The button label is CMS content (showcase.saveLabel); without one
 * the button is drawn empty.
 */
export function CmsPhone({ saveLabel }: { saveLabel?: string | null }) {
  return (
    <div aria-hidden className="relative w-[128px] rounded-[30px] bg-slate p-[7px] shadow-[0_8px_20px_rgba(20,33,46,0.14)]">
      <span className="absolute top-[11px] left-1/2 z-[1] block size-[7px] -translate-x-1/2 rounded-full bg-ink shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.12)]" />
      <div className="flex min-h-[198px] flex-col overflow-hidden rounded-[23px] bg-paper">
        <div className="flex items-center justify-between px-2.5 pt-[9px] pb-0.5">
          {bar('22px', 'bg-muted/40', 'h-1')}
          <span className="flex items-center gap-[3px]">
            <i className="block size-[5px] rounded-full bg-muted/40" />
            <i className="block h-1.5 w-[11px] rounded-[1.5px] border border-muted/40" />
          </span>
        </div>
        <div className="flex items-center gap-1.5 border-b border-hair px-2 pt-1 pb-[7px]">
          <span className="block size-2 shrink-0 rotate-45 border-b-[1.5px] border-l-[1.5px] border-ink/70" />
          <span className="block h-[7px] flex-1 rounded-[3px] bg-ink/70" />
          <span className="block size-3 shrink-0 rounded-full border border-accent/35 bg-accent-soft" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-2 pt-1.5 pb-1.5">
          {bar('44%', 'bg-muted/60', 'h-[5px]')}
          <span className="flex h-5 items-center gap-[3px] rounded-[5px] border border-accent bg-card px-1.5 shadow-[0_0_0_2px_color-mix(in_srgb,var(--accent)_22%,transparent)]">
            {bar('34%', 'bg-muted/70', 'h-[5px]')}
            <span className="block h-2 w-[24%] rounded-[1px] bg-accent/35" />
            <span className="block h-2.5 w-[1.5px] shrink-0 rounded-[1px] bg-accent-strong" />
          </span>
          <span className="grid grid-cols-3 gap-1">
            <span className="block h-[26px] rounded bg-gradient-to-br from-accent-soft to-accent/30" />
            <span className="block h-[26px] rounded bg-gradient-to-br from-accent-soft via-accent-soft to-accent/20" />
            <span className="block h-[26px] rounded bg-gradient-to-br from-accent/45 to-accent-soft" />
          </span>
          {bar('28%', 'bg-muted/60', 'h-[5px]')}
          <span className="flex h-5 items-center rounded-[5px] border border-hair bg-card px-1.5">{bar('58%', 'bg-hair', 'h-[5px]')}</span>
        </div>
        <div className="border-t border-hair bg-card/60 px-2 pt-1.5 pb-2">
          <span className="flex h-[18px] w-full items-center justify-center rounded-pill bg-accent text-[8px] leading-none font-bold tracking-[0.02em] text-accent-ink">
            {saveLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

/** stepsShowcase frames (fixed 120px tall). */
export function StepWireframe() {
  return (
    <div aria-hidden className="flex h-full flex-col gap-2 p-4">
      {bar('36%', 'bg-muted/40', 'h-2')}
      {bar('64%', 'bg-muted/30', 'h-2')}
      <span className="block flex-1 rounded-lg border-2 border-dashed border-hair bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--hair)_6px_7px)]" />
    </div>
  )
}

export function StepLive() {
  return (
    <div aria-hidden className="flex h-full flex-col gap-2 p-4">
      {bar('46%', 'bg-accent', 'h-2')}
      <span className="grid flex-1 grid-cols-2 gap-2">
        <span className="block rounded-lg border border-hair bg-card" />
        <span className="block rounded-lg border border-hair bg-card" />
      </span>
    </div>
  )
}

export function StepCms() {
  return (
    <div aria-hidden className="grid h-full grid-cols-[22%_1fr] gap-2 p-4">
      <span className="block rounded-md bg-slate" />
      <span className="flex flex-col gap-1.5">
        <span className="block h-3 rounded border border-hair bg-card" />
        <span className="block h-3 rounded border border-hair bg-card" />
        <span className="block h-3 rounded border border-hair bg-card" />
        <span className="block h-3 w-[70%] rounded border border-hair bg-card" />
      </span>
    </div>
  )
}
