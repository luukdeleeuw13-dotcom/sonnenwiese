-- Vragen die géén boekingsaanvraag zijn.
-- Uitvoeren in de Supabase SQL Editor, net als 0001_init.sql.
--
-- Waarom een eigen tabel en niet een extra veld op bookings: sinds de
-- verhuur per hele week gaat (zaterdag tot zaterdag) is het boekings-
-- formulier bewust streng. Wie een halve week wil, twee nachten zoekt of
-- gewoon iets wil weten, moet ergens anders terechtkunnen — zonder dat die
-- vraag als losse datum in de agenda belandt. Een vraag heeft dan ook geen
-- status 'confirmed' en blokkeert niets in de kalender.

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  full_name text not null,
  email text not null,
  phone text,

  -- Vrije tekst, bewust géén date-kolom: "eind juli, een lang weekend" is
  -- precies het soort periode waarvoor dit formulier bestaat.
  period text,
  message text not null,

  -- taal waarin de vraag gesteld is (nl/de/en), zodat we zo terugmailen
  locale text not null default 'nl',

  -- Afgehandeld = beantwoord. Blijft staan tot de bewaartermijn hem
  -- opruimt, zodat je kunt terugzien wat er gevraagd is.
  handled boolean not null default false
);

-- Het beheerscherm toont eerst de onbeantwoorde vragen, nieuwste bovenaan.
create index if not exists inquiries_handled_created_idx
  on public.inquiries (handled, created_at desc);

-- Zelfde regime als bookings: RLS aan zonder policies betekent dat anon en
-- authenticated er niets mee kunnen. Alleen de server, met de service role
-- key, komt erbij.
alter table public.inquiries enable row level security;
