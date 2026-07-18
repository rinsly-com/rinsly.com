# Adjudication — Rinsly Pricing & Positioning (analyst vs. reviewer)

*Independent referee pass over `analisation-01.md` (the analyst) and
`analisation-02.md` (the reviewer). Every contested fact below was checked by me
against a primary source — Rinsly's own seed (`scripts/seed.ts`, = what renders
on the site) or the competitor's own live page — not against either agent's
secondhand account. Sources cited inline. I am not a financial or legal advisor;
the SLA/compliance items both agents flagged for professional review still need
it and I have not adjudicated them.*

---

## 1. Single reconciled verdict

**Act on the analysis — with the corrections below.** The underlying analysis is
factually sound where it matters most: I re-verified every Rinsly plan, price,
inclusion, exclusion, contract term, VAT basis and ownership claim against
`scripts/seed.ts` and they match **verbatim** — no fabrication, no invented
competitor. The positioning verdict (Care mid-price/high-value · Volledig beheerd
high-headline-only-against-a-different-product · Partner under-monetised · Op maat
opaque) is supported, not asserted.

**The review deserves high weight.** I checked all six of the reviewer's factual
findings against the primary sources and **all six are correct.** The reviewer
introduced no errors of its own — rare — and correctly kept every one from
overturning the analyst's conclusions. Adopt its corrections wholesale.

**What is now established** (verified, no change): every Rinsly fact; the annual
math (11× monthly, 1 month free = 8.3%); the headline competitor prices
(Webtify, Froseo, Webframer, Antum, WJonderhoud, KeurigOnline, Webarctic); Froseo
retaining framework ownership; the €73/hr zzp average and OnlineLabs' headless
positioning; and the apples-to-apples separation of product classes.

**What genuinely remains contested** (judgment, not fact): the exact Partner raise
(€229 / €249 / €279) and the exact Op maat floor (€499). Reasonable analysts
differ; both are positioning choices, not derived numbers.

**One item neither agent caught** (see §4): the site scopes **Care to "sites we
built"** — it is a post-build retention tier, not the universal on-ramp both
agents called it. This corrects the framing but *reinforces* the shared
recommendation to surface the one-off build.

---

## 2. Agreement / disagreement map

**Both agents agree (and I confirm):** all Rinsly facts; the four-class market
split; that Rinsly is a custom-owned-headless product not comparable on headline
to templated WordPress; that Care is mid-price/high-value; that the €199→"on
request" cliff is the real problem for up-market credibility; that the fix is a
priced-"from" top tier with visible SLA/compliance signals; that the build should
be surfaced at "vanaf €2.500"; that annual prepay can be rewarded without
reintroducing lock-in; and that SLA/compliance wording needs legal review.

**Reviewer challenged the analyst on:** the build-cost range (FACT-1), the TransIP
floor (FACT-2), the Savvii figure (FACT-3), the Vwebdesign CMS (FACT-4), the
Webframer lock-in claim (FACT-5), incidental maintenance/freelance bands (FACT-6),
and four judgment calls (the "cheap hours" math, "underpriced," the €499 floor,
the VAT hedge).

**Reviewer left unchallenged:** the entire positioning verdict, the growth-goal
argument, the recommendation logic, and — critically — the **Care scope** and the
**apples-to-apples annualised comparison for Volledig beheerd** (see §4).

---

## 3. Disagreement ledger

| # | Analyst's position | Reviewer's position | My ruling | Primary-source evidence | Corrected value |
|---|---|---|---|---|---|
| **FACT-1** | MKB build €2.000–7.500; maatwerk €5.000–40.000+ | Sources now show higher floors; €2.000 and €40k+ unsupported | **Reviewer correct** | searchlab: "Professionele MKB-site €4.000–€8.000", "Strategisch maatwerk €8.000–€15.000+"; OnlineLabs: Starter €2.500–5.000, Zakelijke €7.500–15.000 | MKB **~€2.500–8.000**; maatwerk **€8.000–15.000+**. (€40k+ exists only in OnlineLabs' *webshop/webapp* tiers, not for websites.) "vanaf €2.500" survives — traces to OnlineLabs Starter floor. |
| **FACT-2** | TransIP "from €3,99/mo" as the floor | €3,99 is a 3-month intro; standing €12,50 | **Reviewer correct** | transip.nl: "Actietarief geldt voor de eerste 3 maanden," regular €12,50/mo, excl. VAT | Floor **from €12,50/mo standing** (€3,99 = 3-mo promo). |
| **FACT-3** | Savvii "from €29/mo" (cited to an aggregator) | Cannot confirm from Savvii's own site | **Reviewer correct** | savvii.com shows **no price**; visitors must contact/login | Treat €29 as **unverified**; drop or re-source before customer-facing use. |
| **FACT-4** | Vwebdesign €39 among "WordPress templates" | Runs on proprietary SiteCMS, not WordPress | **Reviewer correct** | vwebdesign.nl: "SiteCMS… ons in eigenhuis gemaakte CMS" (€39 price correct) | Class argument holds; **don't call it WordPress.** |
| **FACT-5** | Low abonnementen "recover cost via lock-in" | Webframer has no setup and is monthly cancellable | **Reviewer correct** | webframer.nl: "€0,- opstartkosten," "maandelijks opzegbaar," WordPress, "excl. 21% BTW" | Soften to "**usually** via setup fees and/or lock-in." Setup/lock-in is real for Webtify + Froseo only. |
| **FACT-6** | Basic maintenance €30–150/mo; freelance €60–120/hr | pcpatrol shows €40–100 basic / €150–250 mid / €350+ premium; freelance ~€50–100 | **Reviewer correct** (materially) | pcpatrol.nl: "€40 tot €100" basic, "€150 tot €250" mid, "€350 of meer" premium | Basic **€40–100**, mid **€150–250**, premium **€350+**. Freelance hourly is immaterial and neither side's figure is cleanly sourced; the load-bearing **€73/hr zzp is verified exactly**. |
| **JUDG-1** | Partner increment ≈ "€33–50/hr" | +€100÷4 = €25/hr (or €33/hr on the 3 incremental hrs); €50 unreachable; increments also buy SLA/roadmap/SEO | **Reviewer correct on the math; direction survives** | seed: Partner €199 / "tot 4 uur", Volledig beheerd €99 / "tot 1 uur" | State it as an **implied effective rate ~€25–33/hr**, well below €73 — conclusion (under-monetised) unchanged. |
| **JUDG-2** | Care is "underpriced" | That's a value judgment, not a benchmarked fact | **Reviewer correct (framing)** | Care €49 sits within pcpatrol's €40–100 basic band | Keep €49; call it "correctly priced for the on-ramp," not "underpriced-as-fact." |
| **JUDG-3** | Op maat → "vanaf €499/mo" | €499 sits above even the €350+ premium band; positioning choice, not derived | **Reviewer correct** | pcpatrol premium "€350 of meer" | €499 is a **defensible self-qualifying floor**, label it as positioning. Genuine judgment call. |
| **JUDG-4** | Blanket "treat competitor numbers as ±21% VAT" | Froseo & Webframer state ex-VAT; hedge is lazy | **Both partly right** | Froseo "excl. btw" ✓, Webframer "excl. 21% BTW" ✓ — directly comparable. **But Webtify states no VAT basis** (verified) and it is the key Volledig-beheerd comparator; consumer onderhoud pages are ambiguous | Drop the blanket hedge; **keep it for Webtify and consumer-facing pages.** |

---

## 4. Agreed but wrong / shared blind spots

**A. Care is scoped to existing Rinsly-built sites — it is not a universal
on-ramp.** Both agents framed €49 Care as "the entry point / on-ramp for a founder
who just wants their site kept alive" (analyst §4; reviewer endorsed). The site
says otherwise: Care is **"Voor sites die wij bouwden"** (`seed.ts` — *for sites
we built*). A prospect without a Rinsly-built site cannot enter at Care; the real
entry point is the **one-off build**, which is hidden in the FAQ. This is a
genuine "agreed but wrong" framing error neither caught — and it *strengthens* the
shared recommendation: surfacing the build isn't just an anchor, it's the actual
front door. Re-label Care as the post-build **retention** tier.

**B. The Volledig-beheerd-vs-Webtify comparison was never annualised.** Both
treated €99 as "high headline vs Webtify €50." Verified like-for-like: Webtify
Business is €50/mo **+ €250 setup** and includes **12 hrs/yr changes ≈ 1 hr/mo** —
the *same* change allowance as Volledig beheerd. Year one Webtify ≈ €850, Volledig
beheerd (annual) = €1.089, for a template-WordPress non-owned site vs a custom
client-owned headless one. The €99 tier is *less* of a premium than the raw "€99
vs €50" framing implies. Not wrong, but the headline overstates the gap; the
value case is even stronger than stated.

**C. No published-price premium headless competitor exists — and that's a
finding.** Both noted competitors cluster cheap/template. The corollary neither
drew: premium managed-headless shops (and OnlineLabs at the top) quote **on
request**, which means Rinsly's own "Op maat: on request" is *normal* at the very
top — the problem is only that the cliff starts at €199. This slightly softens the
"visible €199 ceiling screams small shop" claim while still supporting a published
"from" price at the Op maat tier.

---

## 5. Grading the two agents

**The review (analisation-02): high weight, trustworthy.** Six factual findings,
six confirmed against primary sources; correctly severity-ranked (FACT-1 material,
the rest minor); no fabricated "corrections"; and it preserved every conclusion
rather than manufacturing a takedown. Its one arithmetic correction (JUDG-1) is
right. Only overreach: JUDG-4 slightly overstates — the VAT hedge is warranted for
Webtify and consumer pages, so "lazy" is too strong. It shares blind spot **A**
with the analyst. Overall: an unusually clean, proportionate review.

**The analysis (analisation-01): sound, act-on-with-corrections.** Its decisive
strength — confirmed by me — is that it *actually read the live site*; every
Rinsly fact is verbatim-correct. Its weaknesses are all on the competitor side:
stale/loose external ranges (FACT-1/6), a promo rate quoted as a floor (FACT-2),
an aggregator figure (FACT-3), one misclassification (FACT-4), one
over-generalisation (FACT-5), and one loose per-hour computation (JUDG-1). None
touches the recommendation logic. The positioning verdict and the recommended
moves stand once the numbers are corrected.

---

## 6. Final corrected set of conclusions (rely on these)

**Rinsly today (verified verbatim vs seed):** Care €49/mo · €539/yr; Volledig
beheerd €99/mo · €1.089/yr *(Recommended)*; Partner €199/mo · €2.189/yr; Op maat
on request. Hosting included; ex. 21% btw; monthly cancellable, 1-month notice;
client owns site + data; build is FAQ-only ("tailored quote," "spread over the
first year").

**Market benchmarks (corrected, primary-sourced):**
- Custom build: MKB **~€2.500–8.000**, maatwerk **€8.000–15.000+** (searchlab,
  OnlineLabs). Webshop/webapp runs €10k–100k+ (not the relevant class).
- Maintenance subs: basic **€40–100/mo**, mid **€150–250**, premium **€350+**
  (pcpatrol).
- Managed hosting floor: TransIP **from €12,50 standing** (€3,99 3-mo intro);
  Savvii **unverified**.
- Labour: zzp **€73/hr**, agency **€75–125/hr** (verified).
- All-in abonnement comparators: Webtify €50+€250 setup / €150+€350 (12 & 24
  hrs/yr, WordPress); Froseo €69/€149 (€199 setup waived on annual, **framework
  retained**); Webframer €59 (no setup, monthly cancellable, WordPress);
  Vwebdesign €39 (**SiteCMS**, not WordPress).

**Positioning (upheld):** Care = mid-price / high-value, correctly priced as the
post-build tier; Volledig beheerd = high-*headline*-only against a different
product class, and even that premium is modest once Webtify's setup + 1 hr/mo is
annualised; Partner = under-monetised (implied ~€25–33/hr vs €73 zzp / €75–125
agency); Op maat = opaque and the one real drag on the growth ambition.

**Recommendations (survive, with the corrections applied):**
1. **Keep Care €49 and Volledig beheerd €99.** Re-label Care as the post-build
   retention tier, not a standalone on-ramp.
2. **Surface the one-off build: "Eenmalige bouw vanaf €2.500 (excl. btw) —
   spreiden over het eerste jaar mogelijk."** This is the *actual* entry point and
   the anchor for the recurring fee. (Floor traces to OnlineLabs Starter.)
3. **Raise Partner.** The raise is well-justified (4 hrs at €75–125/hr = €300–500);
   the exact figure is a judgment — **€229–279 is the reasonable band, €249 a fine
   midpoint.** Re-frame around roadmap/SEO outcomes, hours as a fair-use cap.
4. **Convert Op maat into a priced-"from" tier** (rename Scale/Enterprise) naming
   guaranteed SLA, uptime target, staging, and security/compliance/DPA. A **~€499
   floor is a defensible positioning choice, not a derived number** — reasonable
   analysts could set €449–599.
5. **Annual:** keep 1 month free on Care/Volledig beheerd; offer 2 months free on
   Partner/Scale prepay — without reintroducing lock-in (the differentiator vs
   Froseo's annual).
6. **Lead the pricing copy with the three verified differentiators:** you own the
   site + data, monthly cancellable, custom headless on Cloudflare (not a template)
   — precisely where Webtify (setup), Froseo (retained framework, annual lock) and
   the template shops (shared hosting) are weakest.

**Flag for professional review (unchanged, not adjudicated):** the SLA /
"gegarandeerde reactietijden" / any uptime guarantee, and the security/compliance
+ DPA/verwerkersovereenkomst wording — contractual once published.

**Net:** the analyst's conclusions are safe to act on after applying the reviewer's
six corrections, the JUDG-1 restatement, and the Care-scope correction from §4.
