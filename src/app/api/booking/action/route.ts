import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { verifyActionToken } from "@/lib/booking/actionToken";
import { resultPage as page } from "@/lib/booking/resultPage";
import { sendGuestEmail } from "@/lib/email/sendGuestEmail";
import type { BookingRow } from "@/lib/supabase/types";

// Eigenaar klikt Accepteren of Afwijzen in de e-mail. Dit is een GET zodat
// de link direct vanuit de mail werkt; de HMAC-token beschermt tegen
// willekeurige aanroepen.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";
  const action = url.searchParams.get("action") ?? "";

  if (!id || !token || !verifyActionToken(id, token)) {
    return page("Ongeldige link", "Deze link is niet geldig of verlopen.", false);
  }
  if (action !== "accept" && action !== "reject") {
    return page("Ongeldige actie", "Onbekende actie in de link.", false);
  }
  if (!isSupabaseConfigured()) {
    return page("Er ging iets mis", "De database is niet bereikbaar.", false);
  }

  const newStatus = action === "accept" ? "confirmed" : "rejected";
  const supabase = getSupabaseServerClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single<BookingRow>();

  if (error || !booking) {
    return page("Niet gevonden", "Deze aanvraag bestaat niet (meer).", false);
  }

  const period = `${booking.start_date} t/m ${booking.end_date}`;

  if (booking.status === newStatus) {
    return page(
      newStatus === "confirmed" ? "Al geaccepteerd" : "Al afgewezen",
      `De aanvraag van ${booking.full_name} (${period}) was al verwerkt. Er is geen nieuwe mail naar de gast gestuurd.`
    );
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: newStatus })
    .eq("id", id);

  if (updateError) {
    console.error("Failed to update booking status:", updateError);
    return page("Er ging iets mis", "De status kon niet worden bijgewerkt. Probeer het later opnieuw.", false);
  }

  // Gastmail versturen; een mailfout maakt de statuswijziging niet ongedaan.
  let mailNote: string;
  try {
    await sendGuestEmail(booking, newStatus);
    mailNote = `De gast heeft automatisch een ${
      newStatus === "confirmed" ? "bevestigingsmail" : "afwijsmail"
    } ontvangen (${booking.email}).`;
  } catch (e) {
    console.error("Failed to send guest email:", e);
    mailNote = `Let op: de automatische mail naar de gast (${booking.email}) kon niet worden verzonden. Neem zelf even contact op.`;
  }

  if (newStatus === "confirmed") {
    return page(
      "Aanvraag geaccepteerd",
      `${booking.full_name} · ${period} · ${booking.guests} personen.<br><br>De periode is nu geblokkeerd in de kalender. ${mailNote}`
    );
  }
  return page(
    "Aanvraag afgewezen",
    `${booking.full_name} · ${period}.<br><br>${mailNote}`
  );
}
