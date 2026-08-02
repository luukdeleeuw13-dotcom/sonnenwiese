import { NextResponse } from "next/server";
import { addDays, format } from "date-fns";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { sendPaymentCheck } from "@/lib/email/sendPaymentCheck";
import { isOwnerBlock } from "@/lib/admin/bookings";
import { PAYMENT_CHECK_DAYS } from "@/lib/admin/payments";
import type { BookingRow } from "@/lib/supabase/types";

// Elke ochtend: staat er een gast op het punt te komen wiens huur nog als
// openstaand genoteerd is? Dan gaat er één mail naar de eigenaren met de vraag
// of het geld binnen is, en twee knoppen om te antwoorden.
//
// Waarom een venster van vandaag t/m drie dagen vooruit, en niet precies de
// dag drie-dagen-vooraf: mislukt deze taak een ochtend, dan zou die ene gast
// er anders voorgoed doorheen glippen. Het venster haalt hem de volgende dag
// alsnog op. Dubbel vragen kan niet, want payment_check_at wordt gezet.
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
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return NextResponse.json(
      { ok: false, reason: "resend-not-configured" },
      { status: 500 }
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const horizon = format(addDays(new Date(), PAYMENT_CHECK_DAYS), "yyyy-MM-dd");

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "confirmed")
      .gte("start_date", today)
      .lte("start_date", horizon)
      .is("paid_at", null)
      .is("payment_check_at", null)
      .not("invoice_sent_at", "is", null)
      .not("price_cents", "is", null)
      .order("start_date", { ascending: true });

    if (error) throw new Error(error.message);

    // Familie krijgt geen nota, en een eigen blokkade is geen gast die kan
    // betalen. Die filters staan hier en niet in de query, omdat een blokkade
    // aan drie dingen tegelijk herkend wordt.
    const candidates = ((data ?? []) as BookingRow[]).filter(
      (b) => b.invoice_required !== false && !isOwnerBlock(b)
    );

    let asked = 0;
    for (const booking of candidates) {
      // Eerst noteren, dan pas mailen. Andersom zou een mislukte notitie
      // betekenen dat dezelfde vraag morgen opnieuw gesteld wordt, en de dag
      // daarna weer — en een mail die elke ochtend terugkomt leest niemand
      // meer na de tweede keer.
      const { error: markError } = await supabase
        .from("bookings")
        .update({ payment_check_at: new Date().toISOString() })
        .eq("id", booking.id);
      if (markError) {
        console.error(
          `Betaalcontrole: markeren mislukt voor ${booking.id}, mail overgeslagen:`,
          markError
        );
        continue;
      }

      try {
        await sendPaymentCheck(booking);
        asked += 1;
      } catch (e) {
        // Eén mislukte mail mag de rest niet tegenhouden. Het verblijf blijft
        // in het beheerscherm rood staan, dus onzichtbaar wordt het niet.
        console.error(
          `Betaalcontrole: mail mislukt voor ${booking.id}:`,
          e
        );
      }
    }

    return NextResponse.json({ ok: true, checked: candidates.length, asked });
  } catch (e) {
    console.error("Betaalcontrole mislukt:", e);
    return NextResponse.json(
      { ok: false, reason: "payment-check-failed" },
      { status: 500 }
    );
  }
}
