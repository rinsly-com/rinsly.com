/**
 * Decorative frames for the product-led blocks: a browser window holding a
 * small example layout, a phone with a CMS edit view, and the step frames.
 * No text inside them is content (bars, not copy); the overlay chip and the
 * caption are rendered by the block itself. All sizes are fixed or come from
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

/** Home: a business site (nav, headline, brand image, three cards). */
export function MiniBusinessSite() {
  return (
    <div aria-hidden className="flex h-full flex-col gap-3 bg-paper p-4 pr-20">
      <div className="flex items-center gap-2.5">
        <span className="block size-2.5 rounded-sm bg-accent" />
        {bar('18%', 'bg-ink', 'h-2')}
        <span className="ml-auto flex gap-2">{bar('28px')}{bar('28px')}{bar('28px')}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {bar('62%', 'bg-ink/80', 'h-2.5')}
        {bar('40%', 'bg-muted/40')}
      </div>
      <div className="relative h-24 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-accent-soft via-accent-soft to-accent/70">
        <span className="absolute top-7 left-4 block h-2.5 w-[38%] rounded-full bg-card/80" />
        <span className="absolute top-12 left-4 block h-1.5 w-[24%] rounded-full bg-card/60" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex h-14 flex-col gap-1.5 rounded-lg border border-hair bg-card p-2">
            {bar('60%', 'bg-ink/60')}
            {bar('80%')}
          </span>
        ))}
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

/** Partner: a design studio's portfolio site (big type, work grid). */
export function MiniStudioPortfolio() {
  return (
    <div aria-hidden className="flex h-full flex-col gap-3 bg-card p-4 pr-20">
      <div className="flex items-center gap-2.5">
        {bar('14%', 'bg-ink', 'h-2')}
        <span className="ml-auto flex gap-2">{bar('24px')}{bar('24px')}{bar('24px')}</span>
      </div>
      <div className="flex flex-col gap-1.5 pt-1">
        {bar('78%', 'bg-ink', 'h-3.5')}
        {bar('52%', 'bg-ink', 'h-3.5')}
      </div>
      <div className="grid flex-1 grid-cols-[1.4fr_1fr] gap-2">
        <span className="block rounded-lg bg-gradient-to-br from-slate to-accent/80" />
        <span className="grid grid-rows-2 gap-2">
          <span className="block rounded-lg bg-accent-soft" />
          <span className="block rounded-lg bg-gradient-to-br from-accent/30 to-accent-soft" />
        </span>
      </div>
    </div>
  )
}

/** Home only: a phone showing the CMS edit view (fields, one in focus). */
export function CmsPhone() {
  return (
    <div aria-hidden className="w-[128px] rounded-[22px] border-[3px] border-slate bg-slate p-2 pb-3 shadow-card">
      <span className="mx-auto mb-2 block h-1.5 w-11 rounded-full bg-paper/20" />
      <div className="overflow-hidden rounded-xl bg-paper">
        <div className="flex items-center gap-1.5 bg-slate px-2 py-1.5">
          <i className="block size-1.5 rounded-full bg-slate-ink/40" />
          <i className="block size-1.5 rounded-full bg-slate-ink/40" />
          <span className="block h-1 flex-1 rounded-full bg-slate-ink/20" />
        </div>
        <div className="flex flex-col gap-1.5 p-2.5">
          {bar('40%', 'bg-muted/50', 'h-1')}
          <span className="block h-5 rounded-md border-2 border-accent bg-card" />
          {bar('46%', 'bg-muted/50', 'h-1')}
          <span className="block h-5 rounded-md border border-hair bg-card" />
          {bar('34%', 'bg-muted/50', 'h-1')}
          <span className="block h-11 rounded-md border border-hair bg-card" />
          <span className="mt-1 block h-4 w-1/2 self-end rounded-full bg-accent" />
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
