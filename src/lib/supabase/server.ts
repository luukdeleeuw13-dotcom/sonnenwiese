import { createClient } from "@supabase/supabase-js";

// Server-only Supabase-client met de service role key. Er is geen eindgebruikers-
// auth in v1: alle databasetoegang loopt via Route Handlers en Server Components
// op de server, nooit via de browser. RLS staat aan zonder policies (deny-all);
// de service role key omzeilt RLS en mag daarom NOOIT in client-code belanden.
export function getSupabaseServerClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
