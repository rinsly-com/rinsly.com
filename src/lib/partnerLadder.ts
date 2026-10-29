/**
 * Partner revenue-share ladder for the public site.
 *
 * Every number and condition here is taken from the commercial summary's
 * partner section (base 0%, choices +10/+5/+5, measured volume +5 at each
 * exclusive threshold, cumulative, cap 35%, base = recurring subscription
 * revenue ex VAT per settled invoice, build fees and meerwerk excluded).
 * The same percentages live in Ledger's tenantRate.ts and the contract
 * generator. Do not add a rung, a threshold or a duty in this file.
 */

export type LadderLocale = 'nl' | 'en'
export type LadderKind = 'choice' | 'measured'
export type ChoiceField = 'exclusiviteit' | 'relatiebeheer' | 'marketing'

export type LadderRung = {
  id: 'exclusive' | 'relation' | 'marketing' | 'volume-1000' | 'volume-5000' | 'volume-25000'
  pct: number
  kind: LadderKind
  title: string
  detail: string
  field?: ChoiceField
}

export type ProseBlock = { p: string } | { ul: string[] }

/** A partner who carries no responsibilities earns nothing. */
export const PARTNER_BASE_PCT = 0

/** Choices plus the three cumulative volume levels. */
export const PARTNER_MAX_PCT = 35

export const DUTY_PCT = {
  exclusive: 10,
  relation: 5,
  marketing: 5,
} as const

/** Each measured level adds this many points. Levels stack. */
export const VOLUME_STEP_PCT = 5

/**
 * Monthly recurring subscription revenue, ex VAT, above which a level opens.
 * Exclusive: a portfolio sitting on the number has not reached that level.
 */
export const VOLUME_THRESHOLDS_EUR = [1_000, 5_000, 25_000] as const

/** Worked example from the summary: one number governs both invoice routes. */
export const EXAMPLE_PARTNER_PCT = 20
export const GROWTH_MONTHLY_EUR = 249
export const EXAMPLE_RINSLY_KEEPS = '199,20'

const euroGroup = (amount: number) => amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/** How many volume levels a monthly portfolio (ex VAT) has passed. */
export function volumeLevels(monthlyExVat: number): number {
  return VOLUME_THRESHOLDS_EUR.filter((threshold) => monthlyExVat > threshold).length
}

export function partnerRatePct(
  duties: { exclusive: boolean; relation: boolean; marketing: boolean },
  monthlyExVat: number,
): number {
  const fromDuties =
    (duties.exclusive ? DUTY_PCT.exclusive : 0) +
    (duties.relation ? DUTY_PCT.relation : 0) +
    (duties.marketing ? DUTY_PCT.marketing : 0)
  const fromVolume = volumeLevels(monthlyExVat) * VOLUME_STEP_PCT
  return Math.min(fromDuties + fromVolume, PARTNER_MAX_PCT)
}

const rungs = (locale: LadderLocale): LadderRung[] => {
  const nl = locale === 'nl'
  const [first, second, third] = VOLUME_THRESHOLDS_EUR
  const money = (amount: number) => `€${euroGroup(amount)}`
  const volume = (amount: number, id: LadderRung['id']): LadderRung => ({
    id,
    pct: VOLUME_STEP_PCT,
    kind: 'measured',
    title: nl ? `Portfolio boven ${money(amount)} per maand` : `Portfolio above ${money(amount)} a month`,
    detail: nl
      ? `Doorlopende abonnementsomzet boven ${money(amount)} per maand.`
      : `Recurring subscription revenue above ${money(amount)} a month.`,
  })

  return [
    {
      id: 'exclusive',
      pct: DUTY_PCT.exclusive,
      kind: 'choice',
      field: 'exclusiviteit',
      title: nl ? 'Exclusiviteit' : 'Exclusivity',
      detail: nl
        ? 'Nieuw klantwerk en updates gaan naar Rinsly. Klanten die al elders gehost worden, blijven daar. Een grote update (herbouw, migratie, redesign, substantiële uitbreiding) leidt tot een gesprek over migratie.'
        : 'New client work and updates go to Rinsly. Clients already hosted elsewhere stay where they are. A big update (rebuild, migration, redesign, substantial expansion) triggers a migration conversation.',
    },
    {
      id: 'relation',
      pct: DUTY_PCT.relation,
      kind: 'choice',
      field: 'relatiebeheer',
      title: nl ? 'Relatiebeheer' : 'Relationship management',
      detail: nl
        ? 'De partner is de eerste lijn. De klant belt de partner; de partner maakt een ticket. Rinsly heeft geen direct contact met de klant.'
        : 'The partner is the first line. The client calls the partner; the partner files a ticket. Rinsly does no direct client contact.',
    },
    {
      id: 'marketing',
      pct: DUTY_PCT.marketing,
      kind: 'choice',
      field: 'marketing',
      title: 'Marketing',
      detail: nl
        ? 'De partner noemt en verkoopt Rinsly als hostingpartner.'
        : 'The partner names and sells Rinsly as their hosting partner.',
    },
    volume(first, 'volume-1000'),
    volume(second, 'volume-5000'),
    volume(third, 'volume-25000'),
  ]
}

export type PartnerProgrammeCopy = {
  hero: { eyebrow: string; title: string; intro: string }
  ladder: {
    eyebrow: string
    title: string
    intro: string
    kindLabel: Record<LadderKind, string>
    rungs: LadderRung[]
  }
  rules: { eyebrow: string; title: string; paragraphs: string[] }
  invoicing: { eyebrow: string; title: string; blocks: ProseBlock[] }
  calculatorFootnote: string
  formIntro: string
  formZero: string
  asideBase: string
  asideCumulative: string
  asideFigma: string
}

export function partnerProgrammeCopy(locale: LadderLocale): PartnerProgrammeCopy {
  const nl = locale === 'nl'
  const ladderRungs = rungs(locale)
  const [first, second, third] = VOLUME_THRESHOLDS_EUR
  const money = (amount: number) => `€${euroGroup(amount)}`

  const formIntro = nl
    ? `De basis is ${PARTNER_BASE_PCT}%. Het aandeel wordt niet per partner onderhandeld. De keuzes zijn exclusiviteit +${DUTY_PCT.exclusive}%, relatiebeheer +${DUTY_PCT.relation}% en marketing +${DUTY_PCT.marketing}%. De omzetniveaus zijn cumulatief, elk +${VOLUME_STEP_PCT}%: portfolio boven ${money(first)}, boven ${money(second)} en boven ${money(third)} per maand. De ladder eindigt op ${PARTNER_MAX_PCT}% van de doorlopende abonnementsomzet exclusief btw, per betaalde factuur. Eenmalige bouwkosten en meerwerk worden niet gedeeld.`
    : `The base is ${PARTNER_BASE_PCT}%. The share is not negotiated per partner. The choices are exclusivity +${DUTY_PCT.exclusive}%, relationship management +${DUTY_PCT.relation}% and marketing +${DUTY_PCT.marketing}%. The volume levels are cumulative, each +${VOLUME_STEP_PCT}%: portfolio above ${money(first)}, above ${money(second)} and above ${money(third)} a month. The ladder tops out at ${PARTNER_MAX_PCT}% of the recurring subscription revenue excluding VAT, per settled invoice. One-off build fees and meerwerk are not shared.`

  const asideBase = nl
    ? `De basis is ${PARTNER_BASE_PCT}%. Dat is bewust: het percentage betaalt voor werk dat elke maand doorgaat, niet voor een introductie die één keer gedaan wordt.`
    : `The base is ${PARTNER_BASE_PCT}%. That is deliberate: the percentage pays for work that continues every month, not for an introduction made once.`

  const asideCumulative = nl
    ? `De omzetniveaus zijn cumulatief, elk +${VOLUME_STEP_PCT}%. De ladder eindigt op ${PARTNER_MAX_PCT}% van de doorlopende abonnementsomzet exclusief btw, per betaalde factuur. Eenmalige bouwkosten en meerwerk vallen erbuiten.`
    : `The volume levels are cumulative, each +${VOLUME_STEP_PCT}%. The ladder tops out at ${PARTNER_MAX_PCT}% of the recurring subscription revenue excluding VAT, per settled invoice. One-off build fees and meerwerk are not shared.`

  const asideFigma = nl
    ? 'Elke partner heeft een Figma-seat met Dev Mode en levert website-ontwerpen aan als Figma-bestanden. Dat is een voorwaarde, en het verandert het percentage niet.'
    : 'Every partner must hold a Figma seat with Dev Mode and deliver website designs as Figma files. This is a precondition, not a rate modifier.'

  const example = nl
    ? `Eén getal geldt voor beide. Een partner op ${EXAMPLE_PARTNER_PCT}% krijgt ${EXAMPLE_PARTNER_PCT}% terug of koopt met ${EXAMPLE_PARTNER_PCT}% korting. In beide gevallen houdt Rinsly €${EXAMPLE_RINSLY_KEEPS} over van een Growth-abonnement van €${GROWTH_MONTHLY_EUR}. Er is geen aparte groothandelsprijslijst.`
    : `One number governs both. A ${EXAMPLE_PARTNER_PCT}% partner either receives ${EXAMPLE_PARTNER_PCT}% back or buys at ${EXAMPLE_PARTNER_PCT}% off. Either way Rinsly keeps €${EXAMPLE_RINSLY_KEEPS} of a €${GROWTH_MONTHLY_EUR} Growth subscription. There is no separate wholesale price list.`

  return {
    hero: nl
      ? {
          eyebrow: 'Partnerprogramma',
          title: 'Jullie factuur, jullie prijs, jullie merk',
          intro: `Doorverkoop en eigen branding zijn toegestaan. Factureer je de eindklant zelf, dan koop je bij Rinsly in tegen de lijstprijs min jouw percentage, zet je ontwerp en hosting op één factuur, en bepaal je zelf de prijs en desgewenst de abonnementsvorm. Rinsly noem je zoals je Cloudflare noemt: hosting bij Rinsly. Het percentage is in beide factuurroutes hetzelfde getal, van ${PARTNER_BASE_PCT}% tot ${PARTNER_MAX_PCT}% van de doorlopende abonnementsomzet exclusief btw, per betaalde factuur.`,
        }
      : {
          eyebrow: 'Partner programme',
          title: 'Your invoice, your price, your brand',
          intro: `Reselling and your own branding are allowed. If you invoice the end client yourself, you buy from Rinsly at list minus your percentage, put design and hosting on one invoice, and set the price and your own tiers if you want. You may name Rinsly the way anyone names Cloudflare: hosting at Rinsly. The percentage is the same number on both invoice routes, from ${PARTNER_BASE_PCT}% to ${PARTNER_MAX_PCT}% of the recurring subscription revenue excluding VAT, per settled invoice.`,
        },
    ladder: {
      eyebrow: nl ? 'Omzetaandeel' : 'Revenue share',
      title: nl
        ? `De ladder, van ${PARTNER_BASE_PCT}% tot ${PARTNER_MAX_PCT}%`
        : `The ladder, from ${PARTNER_BASE_PCT}% to ${PARTNER_MAX_PCT}%`,
      intro: nl
        ? `Het aandeel wordt niet per partner onderhandeld: het is opgebouwd uit deze vaste ladder. De basis is ${PARTNER_BASE_PCT}%. De omzetniveaus zijn cumulatief, dus de ladder eindigt op ${PARTNER_MAX_PCT}%.`
        : `The share is not negotiated per partner: it is composed from this fixed ladder. The base is ${PARTNER_BASE_PCT}%. The volume levels are cumulative, so the ladder tops out at ${PARTNER_MAX_PCT}%.`,
      kindLabel: nl
        ? { choice: 'Keuze', measured: 'Gemeten' }
        : { choice: 'Choice', measured: 'Measured' },
      rungs: ladderRungs,
    },
    rules: {
      eyebrow: nl ? 'De basis' : 'The base',
      title: nl
        ? 'Doorlopende abonnementsomzet, per betaalde factuur'
        : 'Recurring subscription revenue, per settled invoice',
      paragraphs: nl
        ? [
            `De basis is ${PARTNER_BASE_PCT}%. Een partner die geen verantwoordelijkheden draagt, verdient niets. Dat is bewust: het percentage betaalt voor werk dat elke maand doorgaat, niet voor een introductie die één keer gedaan wordt. Het wordt daarom per factuur betaald: elke factuur die de klant betaalt, zolang die klant blijft en de partner de plicht draagt.`,
            'De basis is de doorlopende abonnementsomzet exclusief btw, per factuur die betaald is. Eenmalige bouwkosten en meerwerk worden niet gedeeld.',
            'Gemeten per maand op actieve abonnementen. Een jaarplan telt als een twaalfde. Een niveau dat bereikt is, geldt meteen. Een niveau gaat pas verloren na twee metingen achter elkaar onder de drempel: één maand respijt.',
            asideFigma,
          ]
        : [
            `The base is ${PARTNER_BASE_PCT}%. A partner who carries no responsibilities earns nothing. That is deliberate: the percentage pays for work that continues every month, not for an introduction made once. It is therefore paid per invoice: every invoice the client settles, for as long as they stay and the partner carries the duty.`,
            'The base is the recurring subscription revenue excluding VAT, per invoice settled. One-off build fees and meerwerk are not shared.',
            'Measured monthly on active subscriptions. A yearly plan counts as a twelfth. A level reached applies at once. A level is lost only after two consecutive measurements below the threshold: one grace month.',
            asideFigma,
          ],
    },
    invoicing: {
      eyebrow: nl ? 'Facturatie' : 'Invoicing',
      title: nl ? 'Jij kiest wie de klant factureert' : 'You choose who invoices the client',
      blocks: nl
        ? [
            {
              p: 'De partner kiest wie factureert. Niet afleiden uit de grootte van de studio. De eindklant sluit de overeenkomst met Rinsly. Dat is de standaard, en daarop staan de voorwaarden, de SLA, de verwerkersovereenkomst en het eigendom van site en data.',
            },
            {
              ul: [
                '**Opzet A, Rinsly factureert (standaard).** Rinsly factureert de eindklant tegen de lijstprijs. De partner factureert niets. Het percentage komt als commissie, zodra de klant betaald heeft, op het factuurritme van die klant. De prijs van de klant is de lijstprijs, vastgesteld door Rinsly. Het betalingsrisico ligt bij Rinsly.',
                '**Opzet B, de partner factureert.** Rinsly factureert de partner tegen de lijstprijs min het ladderpercentage. De partner factureert de klant: ontwerp en hosting op één factuur. Het percentage zit dan als korting in de inkoop. De prijs van de klant is de prijs van de partner: doorverkoop tegen een prijs die de partner zelf bepaalt, met desgewenst een eigen abonnementsvorm. Het betalingsrisico ligt bij de partner: die is Rinsly hoe dan ook verschuldigd.',
              ],
            },
            { p: example },
            {
              ul: [
                'De ladder wordt in beide opzetten gemeten op de lijstprijs, dus de factuurroute verandert niet hoe snel een portfolio de omzetniveaus beklimt.',
                'In opzet B wordt geen commissie geboekt. Het percentage is al van het gefactureerde bedrag af. Beide betalen zou twee keer betalen zijn.',
                'Overschrijdingen van de quota krijgen dezelfde korting. De bouwkosten niet: eenmalige bouwkosten en meerwerk worden nooit gedeeld, dus een bouw die de partner factureert wordt tegen de lijstprijs ingekocht.',
              ],
            },
            {
              p: 'Uitbetaling volgt het geld van de klant. Commissie ontstaat als de factuur van de klant betaald is, niet als die verstuurd is: Rinsly schiet niet voor. Uitbetaling gaat op het factuurritme van die klant. Een klant per maand betekent een uitbetaling per maand. Een klant die een jaar vooruit betaalt, keert het jaar in één keer uit. Per partner per periode opgeteld: elf maandklanten geven één afrekening, niet elf. In opzet B valt er niets uit te betalen. Rinsly factureert de partner op datzelfde ritme, al na aftrek van het percentage.',
            },
            {
              p: 'Doorverkoop en eigen branding zijn toegestaan. Wie zelf factureert, verkoopt door: eigen prijs, eigen abonnementsvorm als de partner dat wil, en Rinsly genoemd zoals iemand Cloudflare noemt: hosting bij Rinsly.',
            },
            {
              p: 'Wat niet meebeweegt is de overeenkomst. De eindklant contracteert in beide routes met Rinsly. Een partner kan een klant teruggeven zonder dat de klant iets verliest: dezelfde site, dezelfde voorwaarden, dezelfde prijs. Rinsly neemt dan de facturatie en de supportlijn over. Rinsly verliest een klant niet omdat een partner vertrekt.',
            },
          ]
        : [
            {
              p: 'The partner chooses who invoices. Do not infer it from the size of the studio. The end client’s agreement is with Rinsly. That is the default, and it carries the terms, the SLA, the processor agreement and the client’s ownership of the site and the data.',
            },
            {
              ul: [
                '**Setup A, Rinsly-billed (default).** Rinsly invoices the end client at list. The partner invoices nothing. The percentage arrives as a commission, once the client has paid, on that client’s billing interval. The client’s price is list, set by Rinsly. The payment risk is Rinsly’s.',
                '**Setup B, partner-billed.** Rinsly invoices the partner at list minus their ladder percentage. The partner invoices their client: design and hosting on one invoice. The percentage is then a discount on the purchase. The client’s price is the partner’s own: they resell at a price they set, and at their own tiers if they want. The payment risk is the partner’s: they owe Rinsly either way.',
              ],
            },
            { p: example },
            {
              ul: [
                'Ladder progression is measured at list in both setups, so the invoice route never changes how fast a portfolio climbs the volume levels.',
                'In setup B no commission is booked. The percentage was already taken off what the partner was charged. Paying both would be paying twice.',
                'Quota overages follow the same discount. The build fee does not: one-off build fees and meerwerk are never shared, so a partner-billed build is bought at list.',
              ],
            },
            {
              p: 'Payout follows the client’s money. Commission accrues when the client’s invoice is settled, not when it is issued: Rinsly never fronts a payment. It is paid on that client’s own billing interval. A monthly client means a monthly payout. A client paying a year up front pays the partner out for the year at once. Aggregated per partner per period: a partner with eleven monthly clients gets one statement, not eleven. In setup B there is nothing to pay out. Rinsly invoices the partner on that same interval, already net of their percentage.',
            },
            {
              p: 'Reselling and own branding are allowed. A partner who invoices their own client is reselling: their own price, their own tiers if they want, and they may name Rinsly the way anyone names Cloudflare: hosting at Rinsly.',
            },
            {
              p: 'What does not move is the agreement. The end client contracts with Rinsly on both routes. A partner can hand a client back without the client losing anything: same site, same terms, same price. Rinsly then picks up the invoicing and the support line. Rinsly never loses a client because a partner left.',
            },
          ],
    },
    calculatorFootnote: nl
      ? `Elk omzetniveau is +${VOLUME_STEP_PCT}% en de niveaus zijn cumulatief, dus de ladder eindigt op ${PARTNER_MAX_PCT}% van de doorlopende abonnementsomzet exclusief btw, per betaalde factuur. Eenmalige bouwkosten en meerwerk vallen erbuiten. Commissie ontstaat als de factuur betaald is, niet als die verstuurd is, en wordt uitbetaald op het factuurritme van die klant. Dit is een indicatie, geen aanbod.`
      : `Each volume level is +${VOLUME_STEP_PCT}% and the levels are cumulative, so the ladder tops out at ${PARTNER_MAX_PCT}% of the recurring subscription revenue excluding VAT, per settled invoice. One-off build fees and meerwerk are not shared. Commission accrues when the invoice is settled, not when it is issued, and is paid on that client’s billing interval. This is an indication, not an offer.`,
    formIntro,
    formZero: asideBase,
    asideBase,
    asideCumulative,
    asideFigma,
  }
}
