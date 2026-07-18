# Service Level Agreement (SLA) — Rinsly "Op maat" — CONCEPT

> **Concept / startpunt, nog geen definitieve juridische tekst.** Deze SLA hoort bij
> het "Op maat"-pakket en wordt als bijlage bij de overeenkomst ondertekend. Laat de
> bindende tekst — met name de servicecredits en de aansprakelijkheidsverhouding —
> door een Nederlandse jurist bevestigen voordat u hem gebruikt. De reactietijden en
> uitsluitingen zijn afgestemd op de algemene voorwaarden (art. 7) en de
> verwerkersovereenkomst uit de Rinsly-offertestack.
>
> Publiceer deze cijfers **niet** op de website — de pricingpagina houdt het
> kwalitatief ("SLA met gegarandeerde reactietijden", "streven naar 99,9% uptime").
> De concrete getallen horen alleen hier, in het getekende stuk.

**Partijen:** Rinsly (Yaron Schaeffer), Kazernestraat 6, 3441 BB Woerden, KvK 85578835
("Opdrachtnemer") en `[Opdrachtgever]` ("Opdrachtgever").
**Hoort bij:** de tussen partijen gesloten hosting- en onderhoudsovereenkomst, pakket
"Op maat". Bij strijdigheid gaat de overeenkomst voor, behalve waar deze SLA daar
uitdrukkelijk van afwijkt (art. 12).

---

## 1. Definities

- **Werkdag / werkuren:** maandag t/m vrijdag, 09:00–17:00 (Europe/Amsterdam),
  feestdagen uitgezonderd.
- **Melding ontvangen:** het moment waarop een storingsmelding per e-mail
  (`contact@rinsly.com`) of via het afgesproken kanaal binnenkomt tijdens werkuren;
  buiten werkuren geldt de eerstvolgende werkdag om 09:00 als ontvangstmoment.
- **Reactietijd:** de tijd tussen "melding ontvangen" en de eerste inhoudelijke
  reactie/bevestiging van Opdrachtnemer. **Dit is uitdrukkelijk géén hersteltijd** —
  Opdrachtnemer garandeert een reactie, niet een oplossing binnen dezelfde termijn.
- **Beschikbaarheid (uptime):** het percentage van de gemeten periode dat de
  productie-website bereikbaar is, buiten de uitsluitingen in artikel 5.

## 2. Prioriteitsniveaus en reactietijden

| Prioriteit | Omschrijving | Gegarandeerde reactietijd |
|---|---|---|
| **P1 — Kritiek** | Website volledig onbereikbaar of onbruikbaar in productie | **≤ 4 werkuren** |
| **P2 — Hoog** | Belangrijke functie werkt niet; geen redelijke workaround | ≤ 1 werkdag |
| **P3 — Normaal** | Beperkte impact of workaround beschikbaar | ≤ 2 werkdagen |
| **P4 — Laag** | Cosmetisch, vraag of wijzigingsverzoek | ≤ 3 werkdagen |

Opdrachtnemer bepaalt de prioriteit in redelijkheid op basis van de gemelde impact en
stemt deze zo nodig met Opdrachtgever af. Reactietijden lopen uitsluitend tijdens
werkuren (§1).

## 3. Wijzigingen en meerwerk

Ontwikkel- en wijzigingsuren binnen het pakket gelden als afgesproken in de
overeenkomst. Werk daarbuiten is meerwerk en wordt conform art. 8 van de algemene
voorwaarden uitgevoerd tegen **€ 95 per uur (excl. btw)**, vooraf afgestemd.

## 4. Beschikbaarheid (uptime)

Opdrachtnemer **streeft naar een beschikbaarheid van 99,9%** per kalendermaand,
gemeten via de uptime-monitoring van Opdrachtnemer.

> **Keuze — leg vast wat voor deze klant geldt:**
>
> **Variant A (standaard, inspanningsverplichting).** 99,9% is een streefwaarde. Bij
> het niet halen ervan spant Opdrachtnemer zich in tot herstel; er zijn geen
> servicecredits. *(Sluit aan bij art. 7.1 van de algemene voorwaarden.)*
>
> **Variant B (harde garantie mét credits).** Alleen opnemen als u de garantie echt
> wilt verkopen. Dan geldt de servicecreditregeling in artikel 6 en **prevaleert deze
> SLA boven art. 7.1** voor deze klant. Zorg dat uw upstream-infrastructuur
> (Cloudflare-abonnement) de garantie ondersteunt voordat u variant B tekent.

99,9% per maand komt neer op maximaal circa **43 minuten** downtime per maand buiten
de uitsluitingen.

## 5. Uitsluitingen

De reactietijden en de beschikbaarheid gelden **niet** voor onbeschikbaarheid of
vertraging die het gevolg is van:

- storingen, wijzigingen of uitval bij Cloudflare of andere toeleveranciers
  (art. 6 en 13 algemene voorwaarden);
- vooraf aangekondigd gepland onderhoud (§7);
- overmacht;
- handelen of nalaten van Opdrachtgever of door haar ingeschakelde derden, onjuist
  gebruik, of door Opdrachtgever aangeleverde content of code;
- koppelingen met of diensten van derden buiten het beheer van Opdrachtnemer;
- problemen met domeinregistratie of DNS die buiten het beheer van Opdrachtnemer
  vallen.

## 6. Servicecredits *(alleen bij variant B)*

- Servicecredits vormen **de enige en uitsluitende remedie** voor het niet halen van
  de uptime-doelstelling; zij treden in de plaats van schadevergoeding.
- De credits bedragen **`[X]`% van de maandvergoeding per `[0,1]`%** dat de gemeten
  beschikbaarheid onder 99,9% ligt.
- De credits bedragen per maand **nooit meer dan `[Y]`% van de maandvergoeding** over
  die maand.
- Credits worden op verzoek van Opdrachtgever binnen `[30]` dagen na de betreffende
  maand verrekend met een volgende factuur en niet uitgekeerd in geld.

## 7. Onderhoud

- **Gepland onderhoud** wordt ten minste `[24]` uur vooraf aangekondigd en waar
  mogelijk buiten werkuren uitgevoerd; het telt niet mee als downtime.
- **Noodonderhoud** (bijv. een kritieke beveiligingsupdate) kan Opdrachtnemer direct
  uitvoeren; Opdrachtnemer informeert Opdrachtgever zo spoedig mogelijk.

## 8. Escalatie, rapportage en staging

- **Contact / escalatie:** `contact@rinsly.com`; escalatiecontact `[naam/telefoon]`.
- **Staging-omgeving:** wijzigingen worden waar zinvol eerst op een staging-omgeving
  getest voordat ze live gaan.
- **Rapportage:** op verzoek, of per kwartaal, levert Opdrachtnemer een overzicht van
  incidenten, reactietijden en beschikbaarheid.

## 9. Verhouding tot de overeenkomst en aansprakelijkheid

Deze SLA maakt onderdeel uit van de overeenkomst. De
**aansprakelijkheidsbeperking van art. 12 van de algemene voorwaarden blijft
onverkort van toepassing**: de totale aansprakelijkheid is beperkt tot directe schade
en tot ten hoogste de in de voorafgaande twaalf maanden betaalde vergoeding, en bij
variant B zijn servicecredits daarbinnen de exclusieve remedie voor uptime.

## 10. Looptijd

Deze SLA volgt de looptijd en opzegtermijn van de onderliggende overeenkomst
(onbepaalde tijd, maandelijks opzegbaar met één maand opzegtermijn — art. 9 algemene
voorwaarden).

---

### Bijlage — per klant in te vullen

| Parameter | Waarde |
|---|---|
| Uptime-variant | A (streven) / B (garantie met credits) |
| P1-reactietijd | ≤ 4 werkuren |
| Servicevenster | ma–vr 09:00–17:00 (Europe/Amsterdam) |
| Uptime-doelstelling | 99,9% per maand |
| Credit per 0,1% onder doel *(variant B)* | `[X]` % |
| Maximale credit per maand *(variant B)* | `[Y]` % |
| Aankondiging gepland onderhoud | `[24]` uur |
| Escalatiecontact | `[naam / telefoon]` |
| Meerwerktarief | € 95 / uur (excl. btw) |
