'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Product motion for the redesign blocks (spec §5.3). Mounted once in the
 * locale layout, next to site-core's SiteAnimator, with the same rules:
 *
 *  - Reduced motion, a live preview (`?preview=1`) or no `.anim` class on
 *    <html>: return before GSAP is imported. Nothing is hidden in those
 *    cases (the hidden start states are CSS under `.anim` only).
 *  - transform and opacity only, inside one gsap.context that is reverted on
 *    every route change. The end state stays inline (y 0, opacity 1): the CSS
 *    start state under `.anim` would otherwise come back after the tween.
 *  - Every animated node sits in a box whose size is fixed in normal flow, so
 *    nothing here can shift layout (no CLS).
 *
 * Hooks:
 *  - [data-assemble="frame"|"phone"]  productHero frames, after first paint:
 *    y 20→0, opacity 0→1, 0.8s power3.out; the phone 0.14s later from y 24,
 *    rotate 3deg.
 *  - [data-phone-float]  after the assembly, y 0↔6px, 3.5s sine.inOut yoyo;
 *    paused while the hero is off screen.
 *  - [data-frame-morph] [data-morph-overlay]  stepsShowcase: once on enter
 *    (top 82%), the wireframe overlays on steps 2 and 3 fade out (0.55s
 *    power2.out, delays 0.15s / 0.3s).
 */
export function RinslyMotion() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (/[?&]preview=(1|true)(&|$)/.test(window.location.search)) return
    if (!document.documentElement.classList.contains('anim')) return
    if (!document.querySelector('[data-assemble], [data-frame-morph]')) return

    let cancelled = false
    let ctx: { revert: () => void } | undefined
    let observer: IntersectionObserver | undefined

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import('gsap'), import('gsap/ScrollTrigger')])
      // `cancelled` flips in the cleanup while the import is in flight.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (cancelled) return
      gsap.registerPlugin(ScrollTrigger)

      ctx = gsap.context(() => {
        const frames = gsap.utils.toArray<HTMLElement>('[data-assemble="frame"]')
        const phones = gsap.utils.toArray<HTMLElement>('[data-assemble="phone"]')
        const floaters = gsap.utils.toArray<HTMLElement>('[data-phone-float]')
        const float = floaters.length
          ? gsap.to(floaters, { y: 6, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1, paused: true })
          : undefined

        requestAnimationFrame(() => {
          if (frames.length) {
            gsap.fromTo(frames, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' })
          }
          if (phones.length) {
            gsap.fromTo(
              phones,
              { y: 24, rotate: 3, opacity: 0 },
              {
                y: 0,
                rotate: 0,
                opacity: 1,
                duration: 0.8,
                delay: 0.14,
                ease: 'power3.out',
                onComplete: () => {
                  if (!float) return
                  float.play()
                  const hero = floaters[0]?.closest('[data-hero]')
                  if (!hero) return
                  observer = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) float.play()
                    else float.pause()
                  })
                  observer.observe(hero)
                },
              },
            )
          }
        })

        gsap.utils.toArray<HTMLElement>('[data-frame-morph]').forEach((group) => {
          const overlays = gsap.utils.toArray<HTMLElement>(group.querySelectorAll('[data-morph-overlay]'))
          if (!overlays.length) return
          ScrollTrigger.create({
            trigger: group,
            start: 'top 82%',
            once: true,
            onEnter: () => {
              overlays.forEach((overlay, i) => {
                gsap.to(overlay, { opacity: 0, duration: 0.55, ease: 'power2.out', delay: 0.15 * (i + 1) })
              })
            },
          })
        })
      })
    })()

    return () => {
      cancelled = true
      observer?.disconnect()
      ctx?.revert()
    }
  }, [pathname])

  return null
}
