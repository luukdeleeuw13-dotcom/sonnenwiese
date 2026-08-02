import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { verifyPaymentToken } from "@/lib/booking/actionToken";
import { resultPage } from "@/lib/booking/resultPage";
import { sendPaymentEmail } from "@/lib/email/sendPaymentEmail";
import type { BookingRow } from "@/lib/supabase/types";

// Het antwoord van de eigenaar op de vraag "heeft deze gast al betaald?".
// Een GET, zodat de link rechtstreeks vanuit de mail werkt; de ondertekende
// token beschermt tegen willekeurige aanroepen.
//
// Dit endpoint is de enige plek waar een herinnering naar een gast vertrekt.
// Dat is met opzet: er gaat geen enkel verwijt de deur uit zonder dat een mens
// eerst op "nee, nog niets gezien" heeft geklikt.

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("token") ?? "";
  const answer = url.searchParams.get("answer") ?? "";

  if (!id || !token || !verifyPaymentToken(id, token)) {
    return resultPage(
      "Ongeldige link",
      "Deze link is niet geldig of verlopen.",
      false
    );
  }
  if (answer !== "yes" && answer !== "no") {
    return resultPage("Ongeldige actie", "Onbekend antwoord in de link.", false);
  }
  if (!isSupabaseConfigured()) {
    return resultPage("Er ging iets mis", "De database is niet bereikbaar.", false);
  }

  const supabase = getSupabaseServerClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single<BookingRow>();

  if (error || !booking) {
    return resultPage("Niet gevonden", "Deze boeking bestaat niet (meer).", false);
  }

  // Twee keer op dezelfde knop klikken hoort niets nieuws te doen — en zeker
  // geen tweede herinnering naar iemand te sturen die al betaald heeft.
  if (booking.paid_at) {
    return resultPage(
      "Stond al op betaald",
      `De huur van ${booking.full_name} was al als ontvangen genoteerd. Er is niets gewijzigd en er ging geen mail uit.`
    );
  }

  if (answer === "yes") {
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ paid_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("Betaalcontrole: op betaald zetten mislukt:", updateError);
      return resultPage(
        "Er ging iets mis",
        "De betaling kon niet worden genoteerd. Zet het in het beheerscherm even met de hand.",
        false
      );
    }

    // De mail naar de gast is de kers, niet de taart: mislukt hij, dan staat
    // de betaling nog steeds goed genoteerd.
    let mailNote: string;
    try {
      await sendPaymentEmail(booking, "received");
      mailNote = `${booking.full_name} heeft een korte bevestiging gekregen (${booking.email}).`;
    } catch (e) {
      console.error("Betaalcontrole: bevestiging naar gast mislukt:", e);
      mailNote = `Let op: de bevestiging naar ${booking.email} kon niet worden verzonden. Dat is niet erg — de betaling staat genoteerd.`;
    }

    return resultPage(
      "Genoteerd als betaald",
      `${booking.full_name} · ${booking.start_date} t/m ${booking.end_date}.<br><br>${mailNote}`
    );
  }

  // Nee: de gast krijgt een herinnering. Eerst versturen, dán noteren — een
  // herinnering die niet aankwam moet je opnieuw kunnen sturen.
  try {
    await sendPaymentEmail(booking, "reminder");
  } catch (e) {
    console.error("Betaalcontrole: herinnering naar gast mislukt:", e);
    return resultPage(
      "Herinnering niet verstuurd",
      `De herinnering naar ${booking.email} kon niet worden verzonden. Er is niets gewijzigd — neem zelf even contact op.`,
      false
    );
  }

  const { error: noteError } = await supabase
    .from("bookings")
    .update({ reminder_sent_at: new Date().toISOString() })
    .eq("id", id);
  if (noteError) {
    console.error("Betaalcontrole: herinnering noteren mislukt:", noteError);
  }

  return resultPage(
    "Herinnering verstuurd",
    `${booking.full_name} (${booking.email}) heeft een vriendelijke herinnering gekregen met het bedrag en het rekeningnummer erbij, in de eigen taal.<br><br>Komt het geld daarna binnen, zet het verblijf dan in het beheerscherm op betaald.`
  );
}
