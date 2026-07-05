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

## Hoe de boekingsflow werkt (v1)

1. Gast kiest een periode in de kalender op **Beschikbaarheid & reserveren**
   en vult het aanvraagformulier in.
2. De aanvraag wordt opgeslagen in Supabase (status `pending`) en de eigenaar
   krijgt een e-mail op `OWNER_NOTIFICATION_EMAIL`.
3. De eigenaar opent Supabase → **Table Editor** → tabel `bookings` en zet de
   status van de aanvraag op `confirmed` (of `rejected`).
4. Bij `confirmed` is de periode direct geblokkeerd in de kalender op de site.

Fase 2 (gepland): accepteer/afwijs-knoppen in de e-mail, automatische
bevestigingsmail naar de gast en een eenvoudig admin-overzicht.

## Eenmalige installatie (accounts aanmaken)

### 1. Supabase (database)

1. Maak een gratis account op [supabase.com](https://supabase.com) en start
   een nieuw project (regio: bv. Frankfurt).
2. Ga naar **SQL Editor**, plak de inhoud van
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   en klik **Run**. Controleer in **Table Editor** dat de tabel `bookings`
   bestaat.
3. Ga naar **Settings → API** en noteer:
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

## Nog aan te leveren (placeholders in de site)

- Prijzen per seizoen (pagina **Prijzen** toont nu "volgt binnenkort")
- Huisregels (pagina **Route & praktisch**)
- Foto's (overal placeholders)
- Het definitieve eigenaarsmailadres
