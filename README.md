# Sonnenwiese — vakantieappartement Maria Alm

Website voor de verhuur van ons familieappartement in Maria Alm (Oostenrijk),
ter vervanging van de oude Joomla-site op sonnenwiese.nl.

- **Frontend**: Next.js (App Router) + Tailwind CSS, drietalig (NL/DE/EN via next-intl)
- **Boekingen**: Supabase (tabel `bookings`)
- **E-mail**: Resend (aanvraag-notificatie naar de eigenaar)
- **Hosting**: Vercel (gratis tier)

## Lokaal draaien

```bash
cp .env.example .env.local   # en vul de echte waarden in (zie hieronder)
npm install
npm run dev
```

De site draait dan op http://localhost:3000 (redirect naar `/nl`).
Zonder ingevulde `.env.local` werkt de hele site ook, alleen toont de
kalender dan alles als vrij en geeft het aanvraagformulier een foutmelding
bij versturen.

## Hoe de boekingsflow werkt

1. Gast kiest een periode in de kalender op **Beschikbaarheid & reserveren**
   en vult het aanvraagformulier in.
2. De aanvraag wordt opgeslagen in Supabase (status `pending`) en de eigenaar
   krijgt een e-mail op `OWNER_NOTIFICATION_EMAIL` met twee knoppen:
   **Accepteren** en **Afwijzen** (beveiligd met een HMAC-token per aanvraag).
3. Bij accepteren: de periode wordt direct geblokkeerd in de kalender én de
   gast ontvangt automatisch een bevestigingsmail in de eigen taal (nl/de/en).
   Bij afwijzen krijgt de gast een nette afwijsmail.
4. Op **/admin** (wachtwoord: env var `ADMIN_PASSWORD`) staat het volledige
   overzicht: nieuwe aanvragen, komende boekingen, en een formulier om
   handmatig periodes te blokkeren (eigen gebruik/onderhoud).

Het domein is inmiddels geverifieerd in Resend en de afzender is
`no-reply@sonnenwiese.nl`, dus gastmails worden gewoon bezorgd. (Zonder
geverifieerd domein levert Resend alleen af op het adres van het eigen
account — daar liep dit tot augustus 2026 tegenaan.)

## Wat de site zelf doet (cron)

Vier taken lopen automatisch; het schema staat in
[`vercel.json`](vercel.json) en de tijden zijn **UTC** (in de zomer twee uur
achter op Nederland):

| Taak | Wanneer | Wat |
| --- | --- | --- |
| `/api/cron/keepalive` | dagelijks 06:00 | één query, zodat Supabase het gratis project niet pauzeert |
| `/api/cron/cleanup` | dagelijks 03:30 | aanvragen en vragen ouder dan een jaar verwijderen (privacyverklaring) |
| `/api/cron/payment-check` | dagelijks 07:00 | vraagt de eigenaar of de huur van de eerstkomende gast binnen is |
| `/api/cron/backup` | zondag 05:00 | alle boekingen en vragen als CSV mailen naar `OWNER_NOTIFICATION_EMAIL` |

Vercel voert crons op het gratis plan hoogstens één keer per dag uit en niet
op de minuut nauwkeurig (±59 min), dus de back-up ligt zondagochtend in de
inbox. Zet op Vercel de env var `CRON_SECRET`: die stuurt Vercel als bearer
token mee, en zonder het juiste token weigeren de vier taken. Voor de back-up
is dat geen luxe — die verstuurt persoonsgegevens.

## Het betaalverzoek

Staat er een bedrag bij een bevestigde boeking, dan zet één knop in `/admin`
het betaalverzoek naar de gast op de post: bedrag, rekening, IBAN en
betalingskenmerk, in de taal waarin de aanvraag binnenkwam. Het bedrag komt uit
de seizoenstabel ([`src/lib/booking/seasons.ts`](src/lib/booking/seasons.ts)),
maar wordt nooit vanzelf ingevuld — je neemt het over met een klik, of je typt
iets anders.

De rekening staat in twee env vars, `OWNER_IBAN` en `OWNER_ACCOUNT_NAME`.
Ontbreekt er één, dan blijft de knop weg en zegt het beheerscherm waarom;
een betaalverzoek zonder rekeningnummer is slechter dan geen betaalverzoek.

Drie dagen voor aankomst kijkt `/api/cron/payment-check` of de huur nog als
openstaand genoteerd staat. Zo ja, dan gaat er **één** mail naar de eigenaren
met twee knoppen:

- **Ja, het geld is binnen** → het verblijf gaat op betaald en de gast krijgt
  een korte bevestiging in de eigen taal.
- **Nee, nog niets gezien** → de gast krijgt een vriendelijke herinnering met
  het bedrag en de rekening erbij, en met de vraag of de berichten elkaar
  gekruist hebben.

Die omweg is opzet. De site weet niet wat er op de bankrekening staat, alleen
wat er in het beheerscherm is aangevinkt. Een automatische herinnering zou dus
een gast kunnen beschuldigen die keurig betaald heeft en bij wie alleen
niemand het vinkje omzette. De computer signaleert, de mens oordeelt, en pas
daarna gaat er iets naar de gast.

De vraag komt hoogstens één keer per boeking (`payment_check_at`). Wie het niet
zeker weet doet niets; in het beheerscherm kan het altijd met de hand.

Dezelfde bestanden zijn ook met de hand te downloaden, met de twee links
rechtsboven op `/admin`.

## Eenmalige installatie (accounts aanmaken)

### 1. Supabase (database)

1. Maak een gratis account op [supabase.com](https://supabase.com) en start
   een nieuw project (regio: bv. Frankfurt).
2. Ga naar **SQL Editor**, plak de inhoud van
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   en klik **Run**. Controleer in **Table Editor** dat de tabel `bookings`
   bestaat.
3. Herhaal dat voor
   [`supabase/migrations/0002_inquiries.sql`](supabase/migrations/0002_inquiries.sql)
   — dat maakt de tabel `inquiries` voor het vragenformulier. Draai de
   migraties op volgorde; ze zijn allemaal veilig opnieuw uit te voeren
   (`create table if not exists`).
4. En daarna
   [`supabase/migrations/0003_payments.sql`](supabase/migrations/0003_payments.sql)
   — die voegt de nota- en betaalstatus toe aan `bookings`.
5. En tot slot
   [`supabase/migrations/0004_payment_flow.sql`](supabase/migrations/0004_payment_flow.sql)
   — twee momenten erbij, zodat de betaalcontrole bijhoudt wat ze al gevraagd
   en gestuurd heeft.
6. Ga naar **Settings → API** en noteer:
   - de **Project URL** → env var `SUPABASE_URL`
   - de **service_role key** → env var `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ De service role key is geheim: nooit delen, nooit committen, alleen
   invullen in `.env.local` en in de Vercel-instellingen.

### 2. Resend (e-mail)

1. Maak een gratis account op [resend.com](https://resend.com).
2. Maak onder **API Keys** een key aan → env var `RESEND_API_KEY`.
3. Voor de start werkt `onboarding@resend.dev` als afzender
   (`RESEND_FROM_EMAIL`) zonder verdere configuratie. Let op: zonder
   geverifieerd domein levert Resend mogelijk alleen af aan het e-mailadres
   van je eigen Resend-account — zet `OWNER_NOTIFICATION_EMAIL` in dat geval
   op datzelfde adres, of verifieer een domein.
4. Later, voor productie: verifieer het eigen domein onder **Domains** en
   verander `RESEND_FROM_EMAIL` in bv. `no-reply@sonnenwiese.nl`.

### 3. Vercel (hosting)

1. Zet dit project op GitHub (repo aanmaken en pushen).
2. Maak een gratis account op [vercel.com](https://vercel.com), kies
   **Import Project** en selecteer de GitHub-repo. De standaardinstellingen
   (Next.js) zijn goed.
3. Voeg vóór de eerste deploy onder **Settings → Environment Variables** alle
   variabelen uit [`.env.example`](.env.example) toe, met de echte waarden.
4. Deploy. Daarna: onder **Settings → Domains** het domein `sonnenwiese.nl`
   toevoegen en de DNS-instructies van Vercel volgen bij de registrar.

## Het eigenaarsmailadres wijzigen

Boekingsaanvragen gaan naar het adres in `OWNER_NOTIFICATION_EMAIL`.
Wijzigen: pas de waarde aan in `.env.local` (lokaal) en/of in
Vercel → Settings → Environment Variables (productie) en redeploy.
Er is geen codewijziging nodig.

## Echte foto's toevoegen

Overal waar nu een "Foto volgt"-placeholder staat, accepteert de code een
`src`. Zet de foto's in `public/photos/` en vul per foto het `src`-pad in:

- Home-hero: `src/app/[locale]/page.tsx` (prop `src` van `<Hero>`)
- Appartement-secties: `src/app/[locale]/appartement/page.tsx`
  (prop `image.src` van elke `<Section>`)
- Fotogalerij: `src/app/[locale]/fotos/page.tsx` (veld `src` per foto)

## Teksten aanpassen

Alle teksten staan in [`messages/nl.json`](messages/nl.json),
[`messages/de.json`](messages/de.json) en [`messages/en.json`](messages/en.json).
Zelfde structuur in alle drie; pas per taal de waarden aan.

## Nog aan te leveren

- Tuinfoto (laatste "Foto volgt"-placeholder, Appartement-pagina)
- Een zomerse foto van de weide bij het huis. Bij de zomersectie op de
  homepage staat nu een bergpanorama, terwijl de tekst over de weilanden
  voor de deur gaat.

Afgerond in augustus 2026 en dus hier weg: het eigenaarsmailadres, de
domein-omzetting naar Vercel, de mailmigratie en de domeinverificatie in
Resend.
