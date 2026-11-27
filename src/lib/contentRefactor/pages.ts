/**
 * Page transforms for the 27 Nov 2026 refactor (builder brief §3, plan 003).
 *
 * Each transform takes a page document in one locale (layout + meta, page
 * relations written as `@slug`) and the accp snapshot of the same document,
 * and edits the document in place through the guarded helpers in `edit.ts`.
 * Expected old values come from the snapshot, so any endpoint edit made after
 * the snapshot shows up as a conflict instead of being overwritten.
 */
import { CONTACT, HOME, PARTNER, PRICING } from './copy'
import {
  byId,
  EditLog,
  insertAfter,
  must,
  str,
  lexicalParagraphs,
  type Json,
  type Obj,
  plainText,
  removeById,
  removeLexicalNode,
  reorder,
  replaceInLexical,
  setField,
} from './edit'

export type Locale = 'nl' | 'en'
export type PageDoc = { layout: Json[]; meta: Obj }
export type PageSlug = 'home' | 'prijzen' | 'partnerprogramma' | 'contact'

/** Block and item ids on accp (from the 27 Nov 16:15 snapshot), per locale. */
const IDS = {
  home: {
    nl: { hero: '6b08713abb5dd40a0f68af9e', b1: '6b08713abb5dd40a0f68af9c', b2: '6b08713abb5dd40a0f68af9d', platform: '6b08713abb5dd40a0f68afa8', engineCard: '6b08713abb5dd40a0f68afa4', edgeCard: '6b08713abb5dd40a0f68afa7', backupFeature: '6b08713abb5dd40a0f68afa6', measure: '6b08713abb5dd40a0f68afa9', tech: '6b08713abb5dd40a0f68afaa', doors: '6b08713abb5dd40a0f68afab', closing: '6b08713abb5dd40a0f68afac' },
    en: { hero: '6b08713dbb5dd40a0f68afaf', b1: '6b08713dbb5dd40a0f68afad', b2: '6b08713dbb5dd40a0f68afae', platform: '6b08713dbb5dd40a0f68afb9', engineCard: '6b08713dbb5dd40a0f68afb5', edgeCard: '6b08713dbb5dd40a0f68afb8', backupFeature: '6b08713dbb5dd40a0f68afb7', measure: '6b08713dbb5dd40a0f68afba', tech: '6b08713dbb5dd40a0f68afbb', doors: '6b08713dbb5dd40a0f68afbc', closing: '6b08713dbb5dd40a0f68afbd' },
  },
  prijzen: {
    nl: { hero: '6b087164bb5dd40a0f68b060', routes: '6b087164bb5dd40a0f68b061', paid: '6b087164bb5dd40a0f68b062', pricing: '6b087164bb5dd40a0f68b081', care: '6b087164bb5dd40a0f68b06c', managed: '6b087164bb5dd40a0f68b073', custom: '6b087164bb5dd40a0f68b080', limit: '6b087164bb5dd40a0f68b082', faq: '6b087164bb5dd40a0f68b089', faqCost: '6b087164bb5dd40a0f68b083', faqLock: '6b087164bb5dd40a0f68b084', faqInvoice: '6b087164bb5dd40a0f68b085', faqCare: '6b087164bb5dd40a0f68b088', cta: '6b087164bb5dd40a0f68b08a' },
    en: { hero: '6b087167bb5dd40a0f68b08b', routes: '6b087167bb5dd40a0f68b08c', paid: '6b087167bb5dd40a0f68b08d', pricing: '6b087167bb5dd40a0f68b0ac', care: '6b087167bb5dd40a0f68b097', managed: '6b087167bb5dd40a0f68b09e', custom: '6b087167bb5dd40a0f68b0ab', limit: '6b087167bb5dd40a0f68b0ad', faq: '6b087167bb5dd40a0f68b0b4', faqCost: '6b087167bb5dd40a0f68b0ae', faqLock: '6b087167bb5dd40a0f68b0af', faqInvoice: '6b087167bb5dd40a0f68b0b0', faqCare: '6b087167bb5dd40a0f68b0b3', cta: '6b087167bb5dd40a0f68b0b5' },
  },
  partnerprogramma: {
    nl: { hero: '6b087147bb5dd40a0f68afc0', ladder: '6b087147bb5dd40a0f68afcd', base: '6b087147bb5dd40a0f68afce', why: '6b087147bb5dd40a0f68afdb', engine: '6b087147bb5dd40a0f68afd1', speed: '6b087147bb5dd40a0f68afd7', operations: '6b087147bb5dd40a0f68afda', framer: '6b087147bb5dd40a0f68afe2', framerNote: '6b087147bb5dd40a0f68afe3', how: '6b087147bb5dd40a0f68afeb', buildStep: '6b087147bb5dd40a0f68afe7', freeBuild: '6b087147bb5dd40a0f68afe6', runStep: '6b087147bb5dd40a0f68afea', diagram: '6b087147bb5dd40a0f68afec', calculator: '6b087147bb5dd40a0f68afed', invoicing: '6b087147bb5dd40a0f68afee', measure: '6b087147bb5dd40a0f68aff0', faq: '6b087147bb5dd40a0f68aff6', faqCost: '6b087147bb5dd40a0f68aff5', closing: '6b087147bb5dd40a0f68aff7' },
    en: { hero: '6b08714bbb5dd40a0f68affa', ladder: '6b08714bbb5dd40a0f68b007', base: '6b08714bbb5dd40a0f68b008', why: '6b08714bbb5dd40a0f68b015', engine: '6b08714bbb5dd40a0f68b00b', speed: '6b08714bbb5dd40a0f68b011', operations: '6b08714bbb5dd40a0f68b014', framer: '6b08714bbb5dd40a0f68b01c', framerNote: '6b08714bbb5dd40a0f68b01d', how: '6b08714bbb5dd40a0f68b025', buildStep: '6b08714bbb5dd40a0f68b021', freeBuild: '6b08714bbb5dd40a0f68b020', runStep: '6b08714bbb5dd40a0f68b024', diagram: '6b08714bbb5dd40a0f68b026', calculator: '6b08714bbb5dd40a0f68b027', invoicing: '6b08714bbb5dd40a0f68b028', measure: '6b08714bbb5dd40a0f68b02a', faq: '6b08714bbb5dd40a0f68b030', faqCost: '6b08714bbb5dd40a0f68b02f', closing: '6b08714bbb5dd40a0f68b031' },
  },
  contact: {
    nl: { hero: '6b087194bb5dd40a0f68b106' },
    en: { hero: '6b087195bb5dd40a0f68b10b' },
  },
} as const

/** Deterministic ids for the blocks and items this migration adds (idempotent re-runs find them). */
export const newId = (locale: Locale, name: string): string => `refactor-20261127-${locale}-${name}`

const obj = (value: Json | undefined): Obj | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : undefined
const block = (doc: PageDoc, id: string): Obj | undefined => byId(doc.layout, id)
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Text of a services/accordion item in the snapshot (the guard's expected value). */
const snap = (pre: PageDoc, id: string): Obj => {
  const found = byId(pre.layout, id)
  if (!found) throw new Error(`accp snapshot has no block ${id}`)
  return found
}

const link = (label: string, page: string, variant = 'primary'): Obj => ({
  label,
  variant,
  type: 'internal',
  page,
  url: null,
  anchor: null,
  newTab: false,
})

// ---------------------------------------------------------------------------
// /home (H-01–H-11)
// ---------------------------------------------------------------------------

function home(doc: PageDoc, pre: PageDoc, l: Locale, log: EditLog): void {
  const id = IDS.home[l]
  const w = `home.${l}`
  const hero = block(doc, id.hero)
  const preHero = snap(pre, id.hero)
  const header = obj(hero?.header)
  const preHeader = must(obj(preHero.header))
  setField(log, `${w}.hero.header`, header, 'eyebrow', preHeader.eyebrow, HOME.eyebrow[l])
  setField(log, `${w}.hero.header`, header, 'intro', preHeader.intro, HOME.intro[l])
  const b1 = byId(hero?.buttons, id.b1)
  const b2 = byId(hero?.buttons, id.b2)
  const preB1 = must(byId(preHero.buttons, id.b1))
  const preB2 = must(byId(preHero.buttons, id.b2))
  setField(log, `${w}.hero.b1`, b1, 'label', preB1.label, HOME.partnerButton[l])
  setField(log, `${w}.hero.b2`, b2, 'label', preB2.label, HOME.businessButton[l])
  // H-03: two equal buttons.
  setField(log, `${w}.hero.b2`, b2, 'variant', preB2.variant, 'primary')

  // H-04: the two doors as cards, directly under the hero; the old rich-text block goes.
  const doorsPre = snap(pre, id.doors)
  const doorsHeader = must(obj(doorsPre.header))
  doc.layout = removeById(log, `${w}.layout`, doc.layout, id.doors, doorsPre)
  doc.layout = insertAfter(log, `${w}.layout`, doc.layout, id.hero, {
    id: newId(l, 'home-doors'),
    blockType: 'services',
    header: { eyebrow: doorsHeader.eyebrow, title: doorsHeader.title, intro: null },
    anchor: 'voor-wie',
    cards: [
      { id: newId(l, 'home-door-studio'), icon: 'IconBrush', title: HOME.doors.studioTitle[l], description: HOME.doors.studioText[l], features: [] },
      { id: newId(l, 'home-door-business'), icon: 'IconBuildingStore', title: HOME.doors.businessTitle[l], description: HOME.doors.businessText[l], features: [] },
    ],
  })
  // H-05
  doc.layout = insertAfter(log, `${w}.layout`, doc.layout, newId(l, 'home-doors'), {
    id: newId(l, 'home-steps'),
    blockType: 'services',
    header: { eyebrow: null, title: HOME.steps.title[l], intro: null },
    anchor: 'zo-werkt-het',
    cards: [
      { id: newId(l, 'home-step-1'), icon: 'IconMessageCircle', title: HOME.steps.one[l], description: null, features: [] },
      { id: newId(l, 'home-step-2'), icon: 'IconRocket', title: HOME.steps.two[l], description: null, features: [] },
      { id: newId(l, 'home-step-3'), icon: 'IconServer2', title: HOME.steps.three[l], description: null, features: [] },
    ],
  })
  // H-06 (no owner name, no portrait)
  doc.layout = insertAfter(log, `${w}.layout`, doc.layout, newId(l, 'home-steps'), {
    id: newId(l, 'home-trust'),
    blockType: 'note',
    text: HOME.trust[l],
  })

  // H-08, H-09
  const platform = block(doc, id.platform)
  const prePlatform = snap(pre, id.platform)
  const pHeader = obj(platform?.header)
  const prePHeader = must(obj(prePlatform.header))
  setField(log, `${w}.platform.header`, pHeader, 'title', prePHeader.title, HOME.platformTitle[l])
  const preIntro = str(prePHeader.intro)
  if (!preIntro.includes(HOME.platformIntroOld[l])) throw new Error(`${w}: snapshot platform intro lacks the X2 sentence`)
  setField(log, `${w}.platform.header`, pHeader, 'intro', preIntro, preIntro.replace(HOME.platformIntroOld[l], HOME.platformIntroNew[l]))
  const engine = byId(platform?.cards, id.engineCard)
  setField(log, `${w}.platform.engine`, engine, 'description', must(byId(prePlatform.cards, id.engineCard)).description, HOME.engineCard[l])
  const edge = byId(platform?.cards, id.edgeCard)
  const backup = byId(edge?.features, id.backupFeature)
  const preBackup = must(byId(must(byId(prePlatform.cards, id.edgeCard)).features, id.backupFeature))
  setField(log, `${w}.platform.edge.feature`, backup, 'text', preBackup.text, HOME.limitsFeature[l])

  // H-07
  const measure = block(doc, id.measure)
  const preMeasure = snap(pre, id.measure)
  setField(log, `${w}.measure`, measure, 'title', preMeasure.title, HOME.measureTitle[l])
  setField(log, `${w}.measure`, measure, 'text', preMeasure.text, HOME.measureText[l])

  // H-10, H-11
  const closing = block(doc, id.closing)
  setField(log, `${w}.closing`, closing, 'text', snap(pre, id.closing).text, HOME.closingStudio[l])
  doc.layout = insertAfter(log, `${w}.layout`, doc.layout, id.closing, {
    id: newId(l, 'home-closing-business'),
    blockType: 'cta',
    eyebrow: null,
    title: HOME.closingBusinessTitle[l],
    text: null,
    anchor: null,
    button: link(HOME.closingBusinessButton[l], '@prijzen', 'secondary'),
  })

  // Brief §3.2 order: hero, doors, steps, trust, platform, measure, tech, closing ×2.
  doc.layout = reorder(log, `${w}.layout`, doc.layout, [
    id.hero,
    newId(l, 'home-doors'),
    newId(l, 'home-steps'),
    newId(l, 'home-trust'),
    id.platform,
    id.measure,
    id.tech,
    id.closing,
    newId(l, 'home-closing-business'),
  ])
}

// ---------------------------------------------------------------------------
// /prijzen (P-01, P-03 paid half, P-06–P-10, P-12–P-15, S-02; P-02/P-04/P-05 flagged off)
// ---------------------------------------------------------------------------

function prijzen(doc: PageDoc, pre: PageDoc, l: Locale, log: EditLog): void {
  const id = IDS.prijzen[l]
  const w = `prijzen.${l}`
  setField(log, `${w}.meta`, doc.meta, 'title', pre.meta.title, PRICING.metaTitle[l])
  setField(log, `${w}.meta`, doc.meta, 'description', pre.meta.description, PRICING.metaDescription[l])

  const hero = block(doc, id.hero)
  const preHeader = must(obj(snap(pre, id.hero).header))
  setField(log, `${w}.hero.header`, obj(hero?.header), 'title', preHeader.title, PRICING.h1[l])
  setField(log, `${w}.hero.header`, obj(hero?.header), 'intro', preHeader.intro, PRICING.heroIntro[l])

  // "Twee routes" / "Gratis bouw" goes while x3v3AndF1 is off; the paid route stays (P-03 second half).
  doc.layout = removeById(log, `${w}.layout`, doc.layout, id.routes, snap(pre, id.routes))
  if (l === 'en') setField(log, `${w}.paid`, block(doc, id.paid), 'text', snap(pre, id.paid).text, PRICING.paidBuildEn)

  const pricing = block(doc, id.pricing)
  const prePricing = snap(pre, id.pricing)
  const care = byId(pricing?.tiers, id.care)
  const preCare = must(byId(prePricing.tiers, id.care))
  const backupPre = must((preCare.features as Obj[]).find((f) => /back-?ups?/i.test(str(f.text))), 'Care backup feature')
  setField(log, `${w}.care.feature`, byId(care?.features, str(backupPre.id)), 'text', backupPre.text, PRICING.careEdge[l])
  const managed = byId(pricing?.tiers, id.managed)
  setField(log, `${w}.managed`, managed, 'for', must(byId(prePricing.tiers, id.managed)).for, PRICING.managedFor[l])
  const custom = byId(pricing?.tiers, id.custom)
  const preCustom = must(byId(prePricing.tiers, id.custom))
  const dpaPre = must((preCustom.features as Obj[]).find((f) => /AVG|GDPR/.test(str(f.text))), 'Op maat DPA feature')
  if (custom && Array.isArray(custom.features)) {
    custom.features = removeById(log, `${w}.custom.features`, custom.features, str(dpaPre.id), dpaPre)
  } else log.conflict(`${w}.custom`, 'tier missing')

  doc.layout = insertAfter(log, `${w}.layout`, doc.layout, id.pricing, {
    id: newId(l, 'prijzen-quote'),
    blockType: 'buttonRow',
    buttons: [{ id: newId(l, 'prijzen-quote-button'), ...link(PRICING.quoteButton[l], '@contact') }],
    alignment: 'center',
    anchor: null,
  })
  doc.layout = insertAfter(log, `${w}.layout`, doc.layout, newId(l, 'prijzen-quote'), {
    id: newId(l, 'prijzen-dpa'),
    blockType: 'note',
    text: PRICING.dpaLine[l],
  })
  setField(log, `${w}.limit`, block(doc, id.limit), 'text', snap(pre, id.limit).text, PRICING.limitNote[l])
  doc.layout = insertAfter(log, `${w}.layout`, doc.layout, id.limit, {
    id: newId(l, 'prijzen-indexation'),
    blockType: 'note',
    text: PRICING.indexation[l],
  })

  // FAQ: the cost and lock-in answers carry "Gratis bouw", "afkoop" and "resterende maanden"; their
  // replacements (P-05) wait for x3v3AndF1, so the items go for now.
  const faq = block(doc, id.faq)
  const preFaq = snap(pre, id.faq)
  if (faq && Array.isArray(faq.items)) {
    faq.items = removeById(log, `${w}.faq`, faq.items, id.faqCost, must(byId(preFaq.items, id.faqCost)))
    faq.items = removeById(log, `${w}.faq`, faq.items, id.faqLock, must(byId(preFaq.items, id.faqLock)))
    replaceInLexical(log, `${w}.faq.invoice`, byId(faq.items, id.faqInvoice), 'body', PRICING.invoiceOld[l], PRICING.invoiceNew[l])
    const careItem = byId(faq.items, id.faqCare)
    const preCareItem = must(byId(preFaq.items, id.faqCare))
    setField(log, `${w}.faq.care`, careItem, 'title', preCareItem.title, PRICING.careSupportTitle[l])
    setField(log, `${w}.faq.care`, careItem, 'body', preCareItem.body, lexicalParagraphs(PRICING.careSupportBody[l]))
    faq.items = insertAfter(log, `${w}.faq`, faq.items, id.faqCare, {
      id: newId(l, 'prijzen-faq-dpa'),
      title: PRICING.dpaFaqTitle[l],
      body: lexicalParagraphs(PRICING.dpaFaqBody[l]),
    })
  } else log.conflict(`${w}.faq`, 'accordion missing')

  // Brief §3.3: plans high on the page, right under the hero.
  doc.layout = reorder(log, `${w}.layout`, doc.layout, [
    id.hero,
    id.pricing,
    newId(l, 'prijzen-quote'),
    newId(l, 'prijzen-dpa'),
    id.limit,
    newId(l, 'prijzen-indexation'),
    id.paid,
    id.faq,
    id.cta,
  ])
}

// ---------------------------------------------------------------------------
// /partnerprogramma (PA-01, PA-02, PA-04, PA-05, PA-06, PA-08; terms v3.3 art. 5)
// ---------------------------------------------------------------------------

function partner(doc: PageDoc, pre: PageDoc, l: Locale, log: EditLog): void {
  const id = IDS.partnerprogramma[l]
  const w = `partnerprogramma.${l}`
  setField(log, `${w}.meta`, doc.meta, 'description', pre.meta.description, PARTNER.metaDescription[l])
  const hero = obj(block(doc, id.hero)?.header)
  const preHero = must(obj(snap(pre, id.hero).header))
  setField(log, `${w}.hero.header`, hero, 'title', preHero.title, PARTNER.h1[l])
  setField(log, `${w}.hero.header`, hero, 'intro', preHero.intro, PARTNER.intro[l])

  const ladder = block(doc, id.ladder)
  const preLadder = snap(pre, id.ladder)
  const preLadderHeader = must(obj(preLadder.header))
  setField(log, `${w}.ladder.header`, obj(ladder?.header), 'title', preLadderHeader.title, PARTNER.ladderTitle[l])
  setField(log, `${w}.ladder.header`, obj(ladder?.header), 'intro', preLadderHeader.intro, PARTNER.ladderIntro[l])
  setField(log, `${w}.ladder`, ladder, 'cards', preLadder.cards, [
    { id: newId(l, 'rung-base'), icon: 'IconCoin', title: PARTNER.rungBase[l], description: null, features: [] },
    { id: newId(l, 'rung-first-line'), icon: 'IconHeadset', title: PARTNER.rungFirstLine[l], description: null, features: [] },
    { id: newId(l, 'rung-sales'), icon: 'IconShoppingCart', title: PARTNER.rungSales[l], description: null, features: [] },
    { id: newId(l, 'rung-volume'), icon: 'IconStack2', title: PARTNER.rungVolume[l], description: PARTNER.rungVolumeText[l], features: [] },
  ])
  doc.layout = insertAfter(log, `${w}.layout`, doc.layout, id.ladder, {
    id: newId(l, 'partner-ladder-caveat'),
    blockType: 'note',
    text: PARTNER.caveat[l],
  })

  // PA-06: "De basis is 0%" paragraph and the old revenue-level measurement go; the design-system line stays.
  const base = block(doc, id.base)
  const preBase = snap(pre, id.base)
  const preParas = (obj(obj(preBase.content)?.root)?.children ?? []) as Json[]
  const keep = preParas.length > 0 ? plainText(preParas[preParas.length - 1]) : ''
  setField(log, `${w}.base`, base, 'content', preBase.content, lexicalParagraphs(PARTNER.base[l], keep))

  // PA-14: calculator footnote.
  setField(log, `${w}.calculator`, block(doc, id.calculator), 'footnote', snap(pre, id.calculator).footnote, PARTNER.calculatorFootnote[l])

  // PA-08 and the "omzetniveaus" bullet (old volume model).
  const invoicing = block(doc, id.invoicing)
  replaceInLexical(log, `${w}.invoicing`, invoicing, 'content', PARTNER.invoiceChoiceOld[l], PARTNER.invoiceChoiceNew[l])
  const levelsBullet =
    l === 'nl'
      ? 'De ladder wordt in beide opzetten gemeten op de lijstprijs, dus de factuurroute verandert niet hoe snel een portfolio de omzetniveaus beklimt.'
      : 'Ladder progression is measured at list in both setups, so the invoice route never changes how fast a portfolio climbs the volume levels.'
  removeLexicalNode(log, `${w}.invoicing`, invoicing, 'content', levelsBullet)

  // PA-13
  replaceInLexical(log, `${w}.invoicing`, invoicing, 'content', PARTNER.defaultOld[l], PARTNER.defaultNew[l])

  // PA-15: FAQ "Wat kost het mij?"
  const preFaqCost = must(byId(snap(pre, id.faq).items, id.faqCost))
  setField(log, `${w}.faq.cost`, byId(block(doc, id.faq)?.items, id.faqCost), 'body', preFaqCost.body, lexicalParagraphs(PARTNER.costFaq[l]))

  // "Waarom Rinsly": engine card (H-09 title, X1), speed card out and operations card R3 (PA-11).
  const why = block(doc, id.why)
  const preWhy = snap(pre, id.why)
  const preWhyIntro = str(obj(preWhy.header)?.intro)
  setField(log, `${w}.why.header`, obj(why?.header), 'intro', preWhyIntro, preWhyIntro.replace(PARTNER.whyOld[l], PARTNER.whyNew[l]))
  const engine = byId(why?.cards, id.engine)
  const preEngine = must(byId(preWhy.cards, id.engine))
  setField(log, `${w}.why.engine`, engine, 'title', preEngine.title, PARTNER.engineTitle[l])
  const preEngineText = str(preEngine.description)
  setField(log, `${w}.why.engine`, engine, 'description', preEngineText, preEngineText.replace(PARTNER.engineFixOld[l], PARTNER.engineFixNew[l]))
  if (why && Array.isArray(why.cards)) why.cards = removeById(log, `${w}.why.cards`, why.cards, id.speed, must(byId(preWhy.cards, id.speed)))
  setField(log, `${w}.why.operations`, byId(why?.cards, id.operations), 'description', must(byId(preWhy.cards, id.operations)).description, PARTNER.operationsCard[l])

  // Brief §1 / WP6: no "Framer" on the site; the comparison section and its trademark note go.
  doc.layout = removeById(log, `${w}.layout`, doc.layout, id.framer, snap(pre, id.framer))
  doc.layout = removeById(log, `${w}.layout`, doc.layout, id.framerNote, snap(pre, id.framerNote))

  // "Hoe het werkt": the no-build tick waits for x3v3AndF1 (PA-10); step 3 = R4.
  const how = block(doc, id.how)
  const preHow = snap(pre, id.how)
  const buildStep = byId(how?.cards, id.buildStep)
  if (buildStep && Array.isArray(buildStep.features)) {
    buildStep.features = removeById(log, `${w}.how.build`, buildStep.features, id.freeBuild, must(byId(must(byId(preHow.cards, id.buildStep)).features, id.freeBuild)))
  } else log.conflict(`${w}.how.build`, 'step missing')
  setField(log, `${w}.how.run`, byId(how?.cards, id.runStep), 'description', must(byId(preHow.cards, id.runStep)).description, PARTNER.runStep[l])
  setField(log, `${w}.diagram`, block(doc, id.diagram), 'caption', snap(pre, id.diagram).caption, PARTNER.diagramCaption[l])

  const measure = block(doc, id.measure)
  setField(log, `${w}.measure`, measure, 'title', snap(pre, id.measure).title, PARTNER.measureTitle[l])
  setField(log, `${w}.measure`, measure, 'text', snap(pre, id.measure).text, PARTNER.measureText[l])
  setField(log, `${w}.closing`, block(doc, id.closing), 'title', snap(pre, id.closing).title, PARTNER.closingTitle[l])

  if (l === 'en') doc.layout = replaceEverywhere(log, `${w}.layout`, doc.layout, PARTNER.enFixes) as Json[]
}

/** Plain substring fixes in every string of a value (used for the EN Dutch leftovers, PA-17). */
function replaceEverywhere(log: EditLog, where: string, value: Json, pairs: [string, string][]): Json {
  if (typeof value === 'string') {
    let next = value
    for (const [from, to] of pairs) next = next.split(from).join(to)
    if (next !== value) log.apply(`${where}: ${value.slice(0, 40)}`)
    return next
  }
  if (Array.isArray(value)) return value.map((item) => replaceEverywhere(log, where, item, pairs))
  if (value && typeof value === 'object') {
    const out: Obj = {}
    for (const [key, item] of Object.entries(value)) out[key] = key === 'id' || key === 'blockType' ? item : replaceEverywhere(log, where, item, pairs)
    return out
  }
  return value
}

// ---------------------------------------------------------------------------
// /contact (C-01 hero intro; the wizard text is code, see OfferteForm.tsx)
// ---------------------------------------------------------------------------

function contact(doc: PageDoc, pre: PageDoc, l: Locale, log: EditLog): void {
  const id = IDS.contact[l]
  const preIntro = str(obj(snap(pre, id.hero).header)?.intro)
  if (!preIntro.includes(CONTACT.introOld[l])) throw new Error(`contact.${l}: snapshot intro lacks the C-01 sentence`)
  setField(log, `contact.${l}.hero.header`, obj(block(doc, id.hero)?.header), 'intro', preIntro, preIntro.replace(CONTACT.introOld[l], CONTACT.introNew[l]))
}

export const PAGE_TRANSFORMS: Record<PageSlug, (doc: PageDoc, pre: PageDoc, l: Locale, log: EditLog) => void> = {
  home,
  prijzen,
  partnerprogramma: partner,
  contact,
}

export const PAGE_SLUGS = Object.keys(PAGE_TRANSFORMS) as PageSlug[]

/** Pure: snapshot-shaped page in, migrated page out (plus the log). */
export function transformPage(slug: PageSlug, locale: Locale, doc: PageDoc, pre: PageDoc): { doc: PageDoc; log: EditLog } {
  const next = clone(doc)
  const log = new EditLog()
  PAGE_TRANSFORMS[slug](next, pre, locale, log)
  return { doc: next, log }
}
