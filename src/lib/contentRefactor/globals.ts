/**
 * Header and footer transforms (G-01, G-02, G-04 address). The globals have no
 * drafts, so these go live on accp when the migration runs.
 *
 * Not here: the footer holder line (needs footerOwnerName), the phone in the
 * footer (G-04 says only if Yaron wants it), EN "KvK:/BTW:" labels and the
 * "Open menu" aria-label (G-03, T-02): those are rendered by site-core.
 */
import { NAV } from './copy'
import { byId, EditLog, insertAfter, type Json, type Obj, removeById, reorder, setField } from './edit'
import { newId, type Locale } from './pages'

export type HeaderDoc = { navItems: Json[]; cta: Obj | null }
export type FooterDoc = { tagline: string | null; address: string | null; phone: string | null; menuItems: Json[] }

const NAV_IDS = {
  nl: { platform: '6b0871b5bb5dd40a0f68b12a', partner: '6b0871b5bb5dd40a0f68b12b', prijzen: '6b0871b5bb5dd40a0f68b12c', over: '6b0871b5bb5dd40a0f68b12d', check: '6b0871b5bb5dd40a0f68b12e' },
  en: { platform: '6b0871b7bb5dd40a0f68b12f', partner: '6b0871b7bb5dd40a0f68b130', prijzen: '6b0871b7bb5dd40a0f68b131', over: '6b0871b7bb5dd40a0f68b132', check: '6b0871b7bb5dd40a0f68b133' },
} as const

const FOOTER_WEBSITE_ITEM = { nl: '6b0871b9bb5dd40a0f68b137', en: '6b0871bbbb5dd40a0f68b140' } as const

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export function transformHeader(l: Locale, doc: HeaderDoc, pre: HeaderDoc): { doc: HeaderDoc; log: EditLog } {
  const next = clone(doc)
  const log = new EditLog()
  const ids = NAV_IDS[l]
  const w = `header.${l}`
  // G-01: Websitecheck moves to the footer (it is already there).
  next.navItems = removeById(log, `${w}.navItems`, next.navItems, ids.check, byId(pre.navItems, ids.check)!)
  next.navItems = insertAfter(log, `${w}.navItems`, next.navItems, null, {
    id: newId(l, 'nav-website'),
    label: NAV.website[l],
    type: 'internal',
    page: '@website',
    url: null,
    anchor: null,
    newTab: false,
  })
  setField(log, `${w}.partner`, byId(next.navItems, ids.partner), 'label', byId(pre.navItems, ids.partner)!.label, NAV.studios[l])
  next.navItems = reorder(log, `${w}.navItems`, next.navItems, [newId(l, 'nav-website'), ids.partner, ids.prijzen, ids.platform, ids.over])
  return { doc: next, log }
}

export function transformFooter(l: Locale, doc: FooterDoc, pre: FooterDoc): { doc: FooterDoc; log: EditLog } {
  const next = clone(doc)
  const log = new EditLog()
  const w = `footer.${l}`
  const holder = next as unknown as Obj
  setField(log, w, holder, 'tagline', pre.tagline, NAV.tagline[l])
  // Not localized: the runner writes it with the default locale only.
  if ('address' in pre) setField(log, w, holder, 'address', pre.address, NAV.address)
  // Brief §2: one label for the business door.
  const item = byId(next.menuItems, FOOTER_WEBSITE_ITEM[l])
  setField(log, `${w}.menu.website`, item, 'label', byId(pre.menuItems, FOOTER_WEBSITE_ITEM[l])!.label, NAV.website[l])
  return { doc: next, log }
}
