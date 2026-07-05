-- Sonnenwiese v1 — boekingsaanvragen en bevestigde boekingen in één tabel.
-- Uitvoeren in de Supabase SQL Editor (zie README, stap "Supabase").

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- 'pending' bij binnenkomst; de eigenaar zet dit in de Table Editor op
  -- 'confirmed' (blokkeert de periode in de kalender) of 'rejected'.
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected')),

  -- gevraagde periode
  start_date date not null,
  end_date date not null,
  guests integer not null check (guests > 0),

  -- contactgegevens van de aanvrager
  full_name text not null,
  email text not null,
  phone text,
  message text,

  -- taal waarin de gast de aanvraag deed (nl/de/en)
  locale text not null default 'nl',

  constraint end_after_start check (end_date > start_date)
);

-- Versnelt de kalenderquery (status = 'confirmed' + datumbereik).
create index if not exists bookings_status_dates_idx
  on public.bookings (status, start_date, end_date);

-- RLS aan zonder policies = alles geweigerd voor anon/authenticated.
-- De service role key (alleen server-side gebruikt) omzeilt RLS; zo werken
-- de insert en de kalenderquery, terwijl een eventueel gelekte anon key
-- niets kan.
alter table public.bookings enable row level security;
