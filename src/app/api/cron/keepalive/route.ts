import { NextResponse } from "next/server";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

// Supabase pauzeert gratis projecten na ongeveer een week zonder activiteit.
// Bij een pauze verdwijnt zelfs de DNS-naam van het project: de kalender kan
// dan niets meer uitlezen en aanvragen mislukken. Dit is precies gebeurd in
// augustus 2026. Eén query per dag houdt het project wakker.
//
// Vercel roept dit aan volgens het schema in vercel.json. Staat CRON_SECRET
// ingesteld, dan stuurt Vercel die mee als bearer token; we weigeren dan
// aanroepen van buitenaf. Zonder CRON_SECRET is het endpoint onschadelijk —
// het leest één rij en schrijft niets.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "supabase-not-configured" },
      { status: 500 }
    );
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true });

    if (error) throw new Error(error.message);
  } catch (e) {
    // Loggen zodat het in de Vercel-logs zichtbaar is; de cron-uitvoering
    // wordt dan als mislukt gemarkeerd.
    console.error("Keepalive-query naar Supabase mislukt:", e);
    return NextResponse.json(
      { ok: false, reason: "supabase-unreachable" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
