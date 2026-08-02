-- Twee momenten erbij, zodat het betaalverzoek zichzelf kan bijhouden.
-- Uitvoeren in de Supabase SQL Editor, na 0003.
--
-- Waarom momenten en geen vinkjes: dezelfde reden als bij invoice_sent_at.
-- "Al gevraagd" zonder datum vertelt je volgend seizoen niet meer wanneer,
-- en juist dat wil je weten als een gast zegt dat hij nooit iets ontving.

alter table public.bookings
  -- Wanneer de eigenaar de vraag "heeft deze gast al betaald?" in de mailbox
  -- kreeg. Staat hier iets, dan stelt de dagelijkse taak die vraag niet nog
  -- een keer — één mail per gast, geen dagelijks geklop.
  add column if not exists payment_check_at timestamptz,

  -- Wanneer de gast een herinnering kreeg. Wordt alleen gezet nadat de
  -- eigenaar zelf op "nee, nog niets gezien" heeft geklikt: het systeem weet
  -- wel wat er aangevinkt is, maar niet wat er op de rekening staat.
  add column if not exists reminder_sent_at timestamptz;
