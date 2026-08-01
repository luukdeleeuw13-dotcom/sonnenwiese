import { sendEmail } from "./send";
import { SITE_URL } from "@/lib/config";
import { createActionToken } from "@/lib/booking/actionToken";
import type { BookingInput } from "@/lib/supabase/types";

// Mailt de eigenaar bij een nieuwe aanvraag, met accepteer/afwijs-knoppen.
// Afzender en ontvanger komen volledig uit env vars — het eigenaarsadres
// wisselen is dus een kwestie van OWNER_NOTIFICATION_EMAIL aanpassen.
export async function sendBookingNotification(
  booking: BookingInput,
  bookingId: string
) {
  const token = createActionToken(bookingId);
  const actionUrl = (action: "accept" | "reject") =>
    `${SITE_URL}/api/booking/action?id=${bookingId}&token=${token}&action=${action}`;

  const rows: [string, string][] = [
    ["Naam", booking.fullName],
    ["E-mail", booking.email],
    ["Telefoon", booking.phone ?? "-"],
    ["Aankomst", booking.startDate],
    ["Vertrek", booking.endDate],
    ["Personen", String(booking.guests)],
    ["Taal gast", booking.locale],
    ["Bericht", booking.message ?? "-"],
  ];

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `
  <div style="font-family: Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #4a3728;">
    <h2 style="font-family: Georgia, serif;">Nieuwe boekingsaanvraag</h2>
    <table style="width: 100%; border-collapse: collapse;">
      ${rows
        .map(
          ([label, value]) => `
      <tr>
        <td style="padding: 6px 12px 6px 0; color: #7c5c42; white-space: nowrap; vertical-align: top;">${label}</td>
        <td style="padding: 6px 0; font-weight: 600;">${esc(value)}</td>
      </tr>`
        )
        .join("")}
    </table>
    <p style="margin: 28px 0;">
      <a href="${actionUrl("accept")}"
         style="background: #6b7f4f; color: #ffffff; padding: 13px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-right: 10px;">
        ✓&nbsp;&nbsp;Accepteren
      </a>
      <a href="${actionUrl("reject")}"
         style="background: #a8503c; color: #ffffff; padding: 13px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
        ✗&nbsp;&nbsp;Afwijzen
      </a>
    </p>
    <p style="color: #7c5c42; font-size: 14px;">
      Bij accepteren wordt de periode direct geblokkeerd in de kalender en
      krijgt de gast automatisch een bevestigingsmail (in de eigen taal).
      Bij afwijzen ontvangt de gast een nette afwijsmail.
    </p>
    <p style="font-size: 14px;">
      <a href="${SITE_URL}/admin" style="color: #55663e;">Alle aanvragen bekijken →</a>
    </p>
  </div>`;

  const text = [
    "Nieuwe boekingsaanvraag voor Sonnenwiese",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Accepteren: ${actionUrl("accept")}`,
    `Afwijzen:   ${actionUrl("reject")}`,
    `Overzicht:  ${SITE_URL}/admin`,
  ].join("\n");

  await sendEmail({
    from: process.env.RESEND_FROM_EMAIL!,
    to: process.env.OWNER_NOTIFICATION_EMAIL!,
    replyTo: booking.email,
    subject: `Nieuwe aanvraag: ${booking.startDate} t/m ${booking.endDate} (${booking.guests} pers.)`,
    html,
    text,
  });
}
