import { NextResponse } from "next/server";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

// De privacyverklaring belooft dat aanvragen na een jaar verdwijnen. Een
// bewaartermijn die je opschrijft maar niet uitvoert is erger dan geen
// bewaartermijn noemen, dus voert deze taak hem elke nacht daadwerkelijk uit.
//
// Twee voorwaarden, allebei nodig:
//   created_at < een jaar geleden — het gaat om hoe lang wíj de gegevens
//     hebben, niet om wanneer iemand langskwam.
//   end_date < vandaag — de beschikbaarheidskalender leest bevestigde
//     boekingen met end_date >= vandaag. Wie ruim een jaar vooruit boekt,
//     zou anders uit de kalender verdwijnen terwijl het verblijf nog moet
//     komen, en dan staan die dagen weer als vrij te boek.
//
// Vragen (tabel inquiries) hebben geen verblijf en dus maar één voorwaarde:
// een jaar na binnenkomst gaan ze weg.
export const dynamic = "force-dynamic";

const RETENTION_DAYS = 365;

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

  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  try {
    const supabase = getSupabaseServerClient();
    // select() na delete geeft de verwijderde rijen terug, zodat we kunnen
    // loggen hoeveel er weg zijn zonder de inhoud vast te houden.
    const { data, error } = await supabase
      .from("bookings")
      .delete()
      .lt("created_at", cutoff)
      .lt("end_date", today)
      .select("id");

    if (error) throw new Error(error.message);

    // Vragen kennen geen verblijf en dus geen einddatum: hier telt alleen
    // hoe lang we ze hebben. De privacyverklaring belooft ook voor vragen
    // een jaar, dus dezelfde termijn.
    const { data: inquiryData, error: inquiryError } = await supabase
      .from("inquiries")
      .delete()
      .lt("created_at", cutoff)
      .select("id");

    if (inquiryError) throw new Error(inquiryError.message);

    const deleted = data?.length ?? 0;
    const deletedInquiries = inquiryData?.length ?? 0;
    if (deleted > 0 || deletedInquiries > 0) {
      console.log(
        `Bewaartermijn: ${deleted} aanvraag/aanvragen en ${deletedInquiries} ` +
          `vraag/vragen ouder dan ${RETENTION_DAYS} dagen verwijderd.`
      );
    }
    return NextResponse.json({
      ok: true,
      deleted,
      deletedInquiries,
      cutoff,
    });
  } catch (e) {
    // Mislukt dit stilzwijgend, dan blijven gegevens langer staan dan wat we
    // publiek beloven — dus loggen en de cron als mislukt markeren.
    console.error("Opruimen van verlopen aanvragen mislukt:", e);
    return NextResponse.json(
      { ok: false, reason: "cleanup-failed" },
      { status: 500 }
    );
  }
}
