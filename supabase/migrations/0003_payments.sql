-- Nota- en betaalstatus per boeking.
-- Uitvoeren in de Supabase SQL Editor, na 0001 en 0002.
--
-- Waarom kolommen op bookings en geen aparte tabel: een nota hoort bij precies
-- één verblijf en er komt er nooit meer dan één per verblijf. Een eigen tabel
-- zou een koppeling opleveren die niets extra's kan.
--
-- De bedragen worden hier nog niet berekend — de seizoensgrenzen en het
-- rekeningnummer liggen nog niet vast. Tot die tijd vul je het bedrag met de
-- hand in; zodra de berekening er is, vult diezelfde kolom zich vanzelf.

alter table public.bookings
  -- Afgesproken totaalbedrag in centen. Centen en niet euro's met een komma:
  -- een kommagetal in een database gaat vroeg of laat een cent verliezen.
  -- Leeg = nog geen bedrag afgesproken.
  add column if not exists price_cents integer,

  -- Familie betaalt niet. Dan hoort er ook geen openstaande nota te blijven
  -- knipperen in het overzicht.
  add column if not exists invoice_required boolean not null default true,

  -- Wanneer de nota de deur uit ging, en wanneer het geld binnen was.
  -- Tijdstippen en geen ja/nee-vinkjes: "verstuurd" zonder datum vertelt je
  -- over twee maanden niet meer of dat op tijd was.
  add column if not exists invoice_sent_at timestamptz,
  add column if not exists paid_at timestamptz;

-- Het overzicht zoekt de eerstkomende gasten op aankomstdatum.
create index if not exists bookings_upcoming_idx
  on public.bookings (status, start_date);
