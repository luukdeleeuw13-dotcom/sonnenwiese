import { Resend } from "resend";
import type { BookingInput } from "@/lib/supabase/types";

// Mailt de eigenaar bij een nieuwe aanvraag. Afzender en ontvanger komen
// volledig uit env vars — het eigenaarsadres wisselen is dus een kwestie
// van OWNER_NOTIFICATION_EMAIL aanpassen, zonder codewijziging.
export async function sendBookingNotification(
  booking: BookingInput,
  bookingId: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const lines = [
    "Nieuwe boekingsaanvraag voor Sonnenwiese",
    "",
    `Naam:      ${booking.fullName}`,
    `E-mail:    ${booking.email}`,
    `Telefoon:  ${booking.phone ?? "-"}`,
    `Aankomst:  ${booking.startDate}`,
    `Vertrek:   ${booking.endDate}`,
    `Personen:  ${booking.guests}`,
    `Taal gast: ${booking.locale}`,
    "",
    "Bericht:",
    booking.message ?? "-",
    "",
    `Aanvraag-ID: ${bookingId}`,
    "",
    "Bevestigen of afwijzen? Zet de status van deze aanvraag in Supabase",
    "(Table Editor → bookings) op 'confirmed' of 'rejected'. Bij 'confirmed'",
    "wordt de periode automatisch geblokkeerd in de kalender op de site.",
  ];

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: process.env.OWNER_NOTIFICATION_EMAIL!,
    replyTo: booking.email,
    subject: `Nieuwe aanvraag: ${booking.startDate} t/m ${booking.endDate} (${booking.guests} pers.)`,
    text: lines.join("\n"),
  });
}
