-- Instellingen die de eigenaar zelf bijstelt, om te beginnen de prijzen.
-- Uitvoeren in de Supabase SQL Editor, na 0004.
--
-- Waarom een tabel en geen code: de weekprijzen en de hoogseizoenen stonden
-- in src/lib/booking/seasons.ts, en elke wijziging — een week erbij in
-- februari, de zomerprijs omhoog — vroeg dus om een programmeur en een
-- deploy. Dit is precies het soort getal dat een eigenaar zelf wil kunnen
-- aanpassen op het moment dat hij het bedenkt.
--
-- Waarom één rij met JSON en geen kolom per prijs: de tabel bestaat uit vier
-- prijzen, een wisselend aantal hoogseizoenen en een looptijd, en die horen
-- bij elkaar. Ze worden samen opgeslagen en samen gelezen; een half
-- bijgewerkte tabel (nieuwe prijzen, oude vakanties) mag niet kunnen bestaan.
--
-- Zolang deze migratie niet gedraaid heeft, of de rij er nog niet is, rekent
-- de site met de tabel uit de code. Er gaat dus niets stuk — alleen het
-- opslaan in het beheerscherm werkt dan nog niet, en dat zegt het scherm.

create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Zelfde regime als de andere tabellen: RLS aan zonder policies, dus alleen
-- de server (service role key) kan erbij.
alter table public.settings enable row level security;
