# Review of "Rinsly — Pricing & Positioning Analysis" (analisation-01.md)

*Second-analyst audit. Method: I verified every Rinsly fact against the live
site and the repo's seed source of truth (`scripts/seed.ts`), and spot-checked
~13 competitor data points against the competitors' own pages. Sources cited
inline. I am not a financial or legal advisor; the SLA/compliance items the
first analyst flagged for professional review still need it — I have not
adjudicated them.*

---

## Overall reliability verdict: **ACT ON IT WITH CORRECTIONS**

The report is fundamentally sound and, unusually for this kind of desk
research, it did the one thing that matters most: **the analyst genuinely read
the live site.** Every Rinsly plan, price, inclusion, exclusion, contract term,
VAT basis and ownership statement in the report matches the site verbatim (see
"Holds up" below). There is **no fabrication, no memory-reconstruction, no
invented competitor.** The apples-to-apples distinction — the whole point of the
exercise — is made explicitly and applied consistently.

What keeps this from "act on as-is" is a cluster of **minor-to-material sourcing
imprecisions** (a build-cost range below what its own sources now show; a
promotional rate quoted as a "floor"; one aggregator figure passed off as
primary; one vendor misclassified) and **two method soft-spots in the core
argument** ("prices hours cheaply" is computed loosely and is partly
self-fulfilling). None of these overturn the report's conclusions. Fix the
numbers below and the recommendations stand.

Confidence: high on the Rinsly facts (primary source, verbatim match), high on
the headline competitor prices (verified), medium on the build-cost anchoring.

---

## Findings — errors of fact (ranked)

### FACT-1 (material) — Build-cost range is below what the cited sources now show
- **Claimed:** "MKB/business site **€2.000–7.500**; true maatwerk €5.000–40.000+"
  (§2.D), used to justify surfacing the one-off build at **"vanaf €2.500"** (§5).
- **Found today:** searchlab now quotes **"€4.000 – €8.000"** for a
  "Professionele MKB-site" and **"€8.000 – €15.000+"** for "Strategisch
  maatwerk" ([searchlab.nl](https://searchlab.nl/blog/wat-kost-een-website-in-2026));
  OnlineLabs lists **Starter €2.500–€5.000**, Zakelijke €7.500–€15.000
  ([onlinelabs.nl](https://www.onlinelabs.nl/blog/wat-kost-een-website-laten-bouwen)).
  So the report's **€2.000 low-end and €40.000+ high-end are not supported by
  either cited source** — the true MKB floor is ~€2.500 (OnlineLabs) to €4.000
  (searchlab).
- **Impact:** Small. The **"vanaf €2.500" build recommendation still traces
  cleanly to OnlineLabs' Starter tier**, so the recommendation survives. But the
  report understates the market floor it is comparing against; if anything a
  "vanaf €2.500" anchor is at the *very bottom* of the real range, which
  *strengthens* the "the recurring fee is backed by a real asset" argument.
  Correct the range to **~€2.500–8.000 (MKB) / €8.000–15.000+ (maatwerk)** with
  the citations above.

### FACT-2 (minor) — TransIP "€3,99/mo" is a 3-month intro rate, not the floor
- **Claimed:** "TransIP Managed WordPress from **€3,99/mo**" as "the floor" (§2.C).
- **Found:** €3,99 is an **introductory rate for the first 3 months**; the
  standing price of the Core package is **€12,50/mo**
  ([transip.nl](https://www.transip.nl/webhosting/managed-wordpress/)).
- **Impact:** Negligible on the conclusion (Rinsly sits far above either
  number), but quoting a promo teaser as "the floor" is a mild cherry-pick.
  Corrected floor: **from €12,50/mo standing (€3,99 intro).**

### FACT-3 (minor) — Savvii "€29/mo" is an aggregator figure, not primary
- **Claimed:** "Savvii from **€29/mo**," cited to
  `wpmaintenance.com/woocommerce-hosting-providers/` (§2.C) — a third-party
  aggregator, and a WooCommerce-hosting page at that.
- **Found:** I could **not confirm €29 from Savvii's own site**
  (savvii.nl 301-redirects to [savvii.com](https://www.savvii.com/); its
  homepage lists no starting price). The figure is plausible but is exactly the
  "aggregator passed off as primary" pattern the brief warns about.
- **Impact:** Negligible (used only as a floor reference). Flag as **unverified
  against primary source**; don't rely on it in customer-facing material without
  checking Savvii's live pricing page.

### FACT-4 (minor) — One "WordPress-template" competitor isn't WordPress
- **Claimed:** the §2.A/B vendors are "overwhelmingly WordPress on templates,"
  and Vwebdesign €39/mo is listed among them.
- **Found:** Vwebdesign's €39 subscription runs on their **own "SiteCMS,"** not
  WordPress ([vwebdesign.nl](https://www.vwebdesign.nl/abonnement/website-130)).
  (€39/mo price itself is correct.)
- **Impact:** None on the class argument — SiteCMS is still a proprietary,
  template subscription, i.e. still *not* a client-owned custom headless build.
  The "not the same product class" point holds; just don't call it WordPress.

### FACT-5 (minor) — "cost recovered via lock-in" mischaracterises Webframer
- **Claimed:** the low-price abonnementen recover the build cost "via lock-in"
  (§2.A).
- **Found:** **Webframer €59/mo is monthly cancellable with no setup fee**
  ([webframer.nl](https://webframer.nl/maandelijkse-website/)). So at least one
  cited example recovers cost neither via setup nor lock-in.
- **Impact:** Minor. The lock-in/setup mechanism is real for Webtify (€250–350
  setup, verified) and Froseo (annual to waive setup, verified), but stating it
  as a blanket rule over-generalises. Soften to "usually via setup fees and/or
  lock-in."

### FACT-6 (minor) — Freelance rate and maintenance "consensus band" slightly off
- **Claimed:** "freelance €60–120"; "market consensus for basic maintenance
  **€30–150/mo**."
- **Found:** searchlab quotes freelancers at **€50–100**
  ([searchlab.nl](https://searchlab.nl/blog/wat-kost-een-website-in-2026));
  pcpatrol puts basic maintenance at **€40–100/mo**, mid-size €150–250, premium
  €350+ ([pcpatrol.nl](https://pcpatrol.nl/wat-kost-wordpress-onderhoud-in-2026-eerlijke-prijsvergelijking-en-rekenvoorbeeld-voor-mkb-en-webbureaus/)).
  The report's own vendor examples (WJonderhoud €12,50, KeurigOnline €20 — both
  verified) sit **below** the €30 low end it quotes.
- **Impact:** Cosmetic. The **zzp average of €73/hr is verified exactly**
  ([bieb.knab.nl](https://bieb.knab.nl/ondernemen/wat-verdient-een-web-developer-zzp-bekijk-uurtarief-en-winst)),
  and that is the number the core finding actually leans on. Tighten the
  incidental ranges.

---

## Findings — disagreements of judgment (labelled, not scored as errors)

### JUDG-1 — "The ladder prices hours cheaply" is computed loosely and is partly self-fulfilling
- The report derives "€50/hr" (Volledig beheerd) and "**~€33–50/hr**" (Partner)
  by dividing the tier increment by the included hours. The Partner arithmetic
  doesn't land where stated: **+€100 ÷ 4 hrs = €25/hr** (or €33/hr if you count
  only the 3 *incremental* hours over Volledig beheerd's 1). Neither is €50.
- More importantly, the increments **also buy non-labour value** — response-time
  SLA (≤2 then ≤1 business day), dedicated contact, quarterly roadmap, proactive
  SEO. Attributing the whole increment to raw hours *manufactures* the "you're
  selling cheap labour" conclusion by stripping out everything that isn't an hour.
- **Verdict:** The *direction* survives regardless (even €25/hr is far below the
  €73 zzp average, so Rinsly is under-monetising) — so this doesn't change the
  recommendation to raise Partner. But present it as "the tier increments imply a
  low effective hourly rate," not as a clean per-hour price, and acknowledge the
  increments include service level, not just time.

### JUDG-2 — "Underpriced" (Care) is a value call, not a fact
- Care at €49 sits mid-band on price (verified: above WJonderhoud €12,50 /
  KeurigOnline €20, at/above Webbeheer ~€42, below Antum €69; within pcpatrol's
  €40–100 basic band). Calling it "**underpriced**" rests entirely on the value
  argument (premium infra, no lock-in, full ownership), which is reasonable — but
  it is a judgment, and the report's own "for solo founders this is attractive
  and fine" partly contradicts the "leave it exactly where it is because it's the
  on-ramp" recommendation. Internally consistent enough; just don't read
  "underpriced" as a benchmarked fact.

### JUDG-3 — "Op maat → vanaf €499/mo" is the loosest-anchored number in the report
- The report ties the €499 floor to "mid-size-site retainers (€150–300+) plus
  SLA overhead." Mid-size retainers verify at €150–250, premium €350+
  (pcpatrol). **€499 sits above even the premium band**, so it's a
  defensible "enterprise entry" anchor but it does **not trace tightly** to a
  benchmark — it's "€350+ premium plus a margin." That's fine as a
  self-qualifying floor; label it as a positioning choice, not a derived number.

### JUDG-4 — Blanket "±21% VAT" hedge overstates uncertainty
- Several key comparators **state ex-VAT explicitly** — Froseo ("excl. VAT"),
  Webframer ("excluding 21% VAT") — so they are directly comparable to Rinsly's
  ex-VAT prices with no adjustment. The blanket "treat competitor numbers as
  ±21%" is lazier than the evidence requires; apply it only to the
  consumer-facing pages that are genuinely ambiguous.

---

## What holds up (verified — reported as positive findings)

- **Every Rinsly fact is accurate.** Names (Care / Volledig beheerd / Partner /
  Op maat), monthly prices (€49 / €99 / €199 / on request), annual prices
  (€539 / €1.089 / €2.189), inclusions/exclusions per tier, "hosting included,"
  "ex. 21% btw," no lock-in / monthly cancellable / 1-month notice, "client owns
  site and data," and the build being FAQ-only ("tailored quote," "spread over
  the first year") — **all match the live site and `scripts/seed.ts` verbatim.**
  The analyst did not reconstruct from memory. This is the single most important
  thing to get right, and they got it right.
- **The annual math checks out:** 11 × monthly = annual for all three priced
  tiers (49→539, 99→1.089, 199→2.189); "1 month free ≈ 8.3%" = 1/12. Correct.
- **Headline competitor prices verify:** Webtify Business €50/mo + €250 setup /
  Business Plus €150 + €350, 12–24 hrs/yr, WordPress ✓; Froseo Start €69 / Plus
  €149, €199 setup waived on annual, **framework ownership retained** ✓ (a real,
  verified differentiator); Antum entry €69 ✓; WJonderhoud from €12,50 ✓;
  KeurigOnline from €20 ✓; Webframer €59 ✓; Webarctic €45 ✓.
- **The two most load-bearing external facts are verbatim-accurate:** the zzp
  developer average of **€73/hr** and OnlineLabs' **"WordPress CMS + Next.js
  frontend, 95+ PageSpeed"** positioning (confirming headless is a real,
  marketed differentiator, not a niche).
- **The apples-to-apples reasoning is sound.** The report explicitly separates
  (A) all-in template abonnementen, (B) maintenance subs, (C) managed hosting,
  (D) custom build, and refuses to compare Rinsly's custom-owned-headless product
  on headline price against templated WordPress. That distinction is exactly what
  the brief asks for and it's applied consistently through §3–§5.
- **Caveats are present and honest.** The report states it lacks Rinsly's
  conversion / churn / tier-mix / build-quote / utilisation data, says the
  recommendation would tighten with them, and flags the SLA / uptime-guarantee /
  compliance / DPA wording for legal review before publishing. Appropriate.

---

## On the low/mid/high verdict specifically

The positioning call is **supported, not merely asserted**, and correctly
separates headline price from value delivered. A reasonable analyst looking at
the same verified benchmarks would land in the same place: Care mid-price /
high-value; Volledig beheerd high-headline-only-against-a-different-product;
Partner under-monetised; Op maat opaque. The one place I'd push back is the
leap from "under-monetised" to a specific "raise Partner to €249" — the *raise*
is well-justified (4 hrs at the verified €75–125 agency rate is worth €300–500),
but €249 vs, say, €229 or €279 is a judgment, not an output of the data.

## On whether the structure serves the "grow into larger companies" goal

Agreed and well-argued: the visible €199 ceiling into an opaque "on request" is
the real problem for up-market credibility, and surfacing a priced "from" tier
with named SLA/compliance signals is the right fix. This section is the
strongest in the report and I found nothing to correct in its logic — only that
the specific €499 floor is a positioning choice rather than a derived number
(JUDG-3).

---

## Bottom line for the reader

Trust the Rinsly facts completely. Trust the headline competitor comparison —
it's real and mostly accurate. Before publishing anything customer-facing,
**fix the build-cost range (FACT-1), drop or re-source the TransIP €3,99 and
Savvii €29 floor figures (FACT-2/3), and re-state the "cheap hours" finding as
an implied effective rate rather than a clean per-hour price (JUDG-1).** The
recommendations — keep €49/€99, raise Partner, convert "Op maat" into a priced
"from" tier with visible SLA signals, surface the build at "vanaf €2.500,"
reward annual prepay without reintroducing lock-in — all follow from the
verified evidence and serve the stated solo-founder-now / larger-clients-later
goal. Act on the report with those corrections.
