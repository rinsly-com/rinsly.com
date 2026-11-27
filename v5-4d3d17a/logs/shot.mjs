import { readFileSync, writeFileSync } from 'node:fs'
import { chromium } from '/workspace/builder-redesign-v5/node_modules/.pnpm/playwright@1.58.2/node_modules/playwright/index.mjs'
const AXE = readFileSync('/workspace/builder-redesign-v5/node_modules/.pnpm/axe-core@4.12.1/node_modules/axe-core/axe.min.js', 'utf8')
const [, , outdir, base, ...paths] = process.argv
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--headless=new'] })
const results = []
for (const [vn, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
  for (const motion of ['no-preference', 'reduce']) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: motion })
    await ctx.addInitScript(() => {
      window.__cls = 0
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value }).observe({ type: 'layout-shift', buffered: true })
    })
    const pg = await ctx.newPage()
    for (const p of paths) {
      const r = await pg.goto(base + p, { waitUntil: 'load', timeout: 180000 })
      await pg.addStyleTag({ content: 'nextjs-portal{display:none!important}' })
      await pg.waitForTimeout(1600)
      const name = p.replace(/^\//, '').replace(/\//g, '-') + '-' + vn + (motion === 'reduce' ? '-reduced' : '')
      const foldCls = await pg.evaluate(() => window.__cls)
      const state = await pg.evaluate(() => ({
        anim: document.documentElement.classList.contains('anim'),
        gsapInline: [...document.querySelectorAll('[data-assemble],[data-phone-float],[data-morph-overlay]')].filter((el) => el.getAttribute('style')).length,
        frameOpacity: [...document.querySelectorAll('[data-assemble]')].map((el) => getComputedStyle(el).opacity),
      }))
      if (motion === 'no-preference') await pg.screenshot({ path: `${outdir}/${name}-fold.png` })
      await pg.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)) } scrollTo(0, 0) })
      await pg.waitForTimeout(1200)
      const totalCls = await pg.evaluate(() => window.__cls)
      if (motion === 'no-preference' || vn === 'desktop') await pg.screenshot({ path: `${outdir}/${name}-full.png`, fullPage: true })
      const taps = await pg.evaluate(() =>
        [...document.querySelectorAll('main a[href], main button')]
          .filter((el) => el.offsetParent !== null && !el.closest('[aria-hidden="true"]'))
          .map((el) => { const r = el.getBoundingClientRect(); return { t: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) } })
          .filter((x) => x.w < 32 || x.h < 32),
      )
      let axe = null
      if (motion === 'no-preference') {
        await pg.addScriptTag({ content: AXE })
        axe = await pg.evaluate(async () => {
          const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })
          return res.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 4).map((n) => n.target.join(' ')) }))
        })
      }
      results.push({ page: p, viewport: vn, motion, status: r.status(), foldCls: +foldCls.toFixed(4), totalCls: +totalCls.toFixed(4), ...state, smallTapTargets: taps, axe })
      console.log(r.status(), name, 'cls', foldCls.toFixed(4), totalCls.toFixed(4), 'anim', state.anim, 'inline', state.gsapInline, 'taps<32', taps.length, 'axe', axe ? axe.length : '-')
    }
    await ctx.close()
  }
}
await b.close()
writeFileSync(`${outdir}/checks.json`, JSON.stringify(results, null, 2))
