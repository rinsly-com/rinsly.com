'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Site-wide scroll-motion layer. Mounted once in the locale layout, it scans the
 * server-rendered DOM for opt-in data attributes and wires GSAP animations:
 *
 *   [data-reveal]          → rise + fade as the element scrolls into view
 *   [data-reveal-group]    → its direct children reveal in a stagger
 *   [data-parallax]        → slow drift on scroll (decorative glows)
 *   [data-count]           → count-up of the numeric part of a price/stat
 *   [data-magnetic]        → cursor-follow lift on pointer devices
 *
 * The hero entrance is intentionally NOT here — it runs as pure CSS (see the
 * hero keyframes in globals.css) so the LCP heading paints from the server HTML
 * and never waits on this bundle.
 *
 * Performance notes:
 *  - GSAP (~45 KB gz) is dynamically imported, so it stays out of the initial
 *    JS chunk and loads after hydration. Reduced-motion users bail *before* the
 *    import, so they download none of it.
 *  - Everything is created inside a gsap.context and reverted on cleanup /
 *    route change; magnetic pointer listeners are cleaned up explicitly.
 */
export function SiteAnimator() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return
    // Reduced motion: content is already fully visible (the `.anim` class was
    // never added), so do nothing — and crucially, never even fetch GSAP.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    let ctx: { revert: () => void } | undefined
    const cleanups: Array<() => void> = []

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/ScrollTrigger'),
      ])
      if (cancelled) return

      gsap.registerPlugin(ScrollTrigger)
      gsap.defaults({ ease: 'power3.out' })

      ctx = gsap.context(() => {
        // ── Scroll progress bar ──────────────────────────────────────────
        gsap.to('[data-scroll-progress]', {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
        })

        // ── Scroll reveals (batched for perf) ────────────────────────────
        gsap.set('[data-reveal]', { y: 32 })
        ScrollTrigger.batch('[data-reveal]', {
          start: 'top 88%',
          once: true,
          onEnter: (els) =>
            gsap.to(els, {
              y: 0,
              opacity: 1,
              duration: 0.85,
              stagger: 0.1,
              overwrite: true,
              // Drop the transform layer once revealed — no lingering will-change.
              clearProps: 'transform',
            }),
        })

        // ── Grouped reveals: stagger the children of a container ──────────
        gsap.utils.toArray<HTMLElement>('[data-reveal-group]').forEach((group) => {
          const kids = gsap.utils.toArray<HTMLElement>(group.children)
          gsap.set(kids, { y: 34, opacity: 0 })
          ScrollTrigger.create({
            trigger: group,
            start: 'top 82%',
            once: true,
            onEnter: () =>
              gsap.to(kids, {
                y: 0,
                opacity: 1,
                duration: 0.7,
                stagger: 0.09,
                clearProps: 'transform',
              }),
          })
        })

        // ── Parallax drift on decorative elements ────────────────────────
        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
          const speed = parseFloat(el.dataset.parallax || '0.3')
          gsap.to(el, {
            yPercent: -18 * speed * 10,
            ease: 'none',
            scrollTrigger: {
              trigger: el.closest('section') ?? el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1,
            },
          })
        })

        // ── Count-up on numeric prices / stats ───────────────────────────
        gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
          const raw = el.textContent ?? ''
          const match = raw.match(/(\d[\d.]*)/)
          if (!match) return
          const target = parseInt(match[1].replace(/\./g, ''), 10)
          if (!Number.isFinite(target) || target === 0) return
          const [pre, post] = raw.split(match[1])
          const obj = { val: 0 }
          ScrollTrigger.create({
            trigger: el,
            start: 'top 90%',
            once: true,
            onEnter: () =>
              gsap.to(obj, {
                val: target,
                duration: 1.1,
                ease: 'power2.out',
                onUpdate: () => {
                  el.textContent = `${pre}${Math.round(obj.val).toLocaleString('nl-NL')}${post}`
                },
              }),
          })
        })

        // ── Magnetic buttons (pointer devices only) ──────────────────────
        if (window.matchMedia('(pointer: fine)').matches) {
          gsap.utils.toArray<HTMLElement>('[data-magnetic]').forEach((el) => {
            const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'power3' })
            const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'power3' })
            // Cache the rect instead of reading layout on every pointermove.
            let rect = el.getBoundingClientRect()
            const cacheRect = () => {
              rect = el.getBoundingClientRect()
            }
            const onMove = (e: PointerEvent) => {
              xTo((e.clientX - (rect.left + rect.width / 2)) * 0.35)
              yTo((e.clientY - (rect.top + rect.height / 2)) * 0.35)
            }
            const onLeave = () => {
              xTo(0)
              yTo(0)
            }
            el.addEventListener('pointerenter', cacheRect)
            el.addEventListener('pointermove', onMove)
            el.addEventListener('pointerleave', onLeave)
            window.addEventListener('scroll', cacheRect, { passive: true })
            window.addEventListener('resize', cacheRect)
            cleanups.push(() => {
              el.removeEventListener('pointerenter', cacheRect)
              el.removeEventListener('pointermove', onMove)
              el.removeEventListener('pointerleave', onLeave)
              window.removeEventListener('scroll', cacheRect)
              window.removeEventListener('resize', cacheRect)
            })
          })
        }

        ScrollTrigger.refresh()
      })
    })()

    return () => {
      cancelled = true
      cleanups.forEach((fn) => fn())
      ctx?.revert()
    }
  }, [pathname])

  return (
    <div aria-hidden>
      <div
        data-scroll-progress
        className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left scale-x-0 bg-accent"
      />
    </div>
  )
}

export default SiteAnimator
