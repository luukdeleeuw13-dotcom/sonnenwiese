import { sendEmail } from "./send";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { SITE_URL, ownerEmails } from "@/lib/config";
import { createPaymentToken } from "@/lib/booking/actionToken";
import { formatEuro } from "@/lib/admin/payments";
import type { BookingRow } from "@/lib/supabase/types";

// De vraag aan de eigenaar, drie dagen voor aankomst: is dit geld binnen?
//
// De site weet niet wat er op de rekening staat — hij weet alleen wat er in
// het beheerscherm is aangevinkt. Een gast die keurig betaald heeft maar
// waarbij niemand het vinkje omzette, zou een automatische herinnering krijgen
// en dus onterecht van wanbetaling worden beticht. Vandaar deze omweg: de
// computer signaleert, de mens oordeelt, en pas daarna gaat er iets naar de
// gast.
export function buildPaymentCheck(booking: BookingRow): {
  subject: string;
  html: string;
  text: string;
} {
  const token = createPaymentToken(booking.id);
  const answerUrl = (answer: "yes" | "no") =>
    `${SITE_URL}/api/booking/payment?id=${booking.id}&token=${token}&answer=${answer}`;

  const fmt = (d: string) =>
    format(new Date(`${d}T00:00:00`), "EEEE d MMMM", { locale: nl });

  const amount =
    typeof booking.price_cents === "number"
      ? formatEuro(booking.price_cents)
      : "— (geen bedrag ingevuld)";
  const sent = booking.invoice_sent_at
    ? format(new Date(booking.invoice_sent_at), "d MMMM", { locale: nl })
    : "onbekend";

  const rows: [string, string][] = [
    ["Gast", booking.full_name],
    ["Aankomst", fmt(booking.start_date)],
    ["Vertrek", fmt(booking.end_date)],
    ["Bedrag", amount],
    ["Betaalverzoek verstuurd", sent],
  ];

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `
  <div style="font-family: Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #4a3728;">
    <h2 style="font-family: Georgia, serif;">Heeft ${esc(booking.full_name)} al betaald?</h2>
    <p style="line-height: 1.6;">
      Over drie dagen komen ze aan. In het beheerscherm staat de huur nog als
      openstaand — maar dat zegt alleen iets over het vinkje, niet over de
      bankrekening. Vandaar de vraag.
    </p>
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
      <a href="${answerUrl("yes")}"
         style="background: #6b7f4f; color: #ffffff; padding: 13px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block; margin-right: 10px;">
        ✓&nbsp;&nbsp;Ja, het geld is binnen
      </a>
      <a href="${answerUrl("no")}"
         style="background: #a8503c; color: #ffffff; padding: 13px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
        ✗&nbsp;&nbsp;Nee, nog niets gezien
      </a>
    </p>
    <p style="color: #7c5c42; font-size: 14px; line-height: 1.6;">
      Bij <strong>ja</strong> gaat het verblijf op betaald en krijgt de gast een
      korte bevestiging in de eigen taal.<br>
      Bij <strong>nee</strong> krijgt de gast een vriendelijke herinnering met
      het rekeningnummer erbij — en met de vraag of de berichten elkaar
      gekruist hebben.<br>
      Weet je het niet zeker? Doe dan niets. Deze vraag komt niet nog een keer,
      en in het beheerscherm kun je het altijd zelf zetten.
    </p>
    <p style="font-size: 14px;">
      <a href="${SITE_URL}/admin" style="color: #55663e;">Naar het beheerscherm →</a>
    </p>
  </div>`;

  const text = [
    `Heeft ${booking.full_name} al betaald?`,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Ja, het geld is binnen: ${answerUrl("yes")}`,
    `Nee, nog niets gezien: ${answerUrl("no")}`,
    `Beheerscherm:          ${SITE_URL}/admin`,
    "",
    "Bij ja gaat het verblijf op betaald en krijgt de gast een bevestiging.",
    "Bij nee krijgt de gast een vriendelijke herinnering.",
    "Weet je het niet zeker? Doe dan niets — deze vraag komt niet nog een keer.",
  ].join("\n");

  return {
    subject: `Heeft ${booking.full_name} al betaald? (aankomst ${fmt(
      booking.start_date
    )})`,
    html,
    text,
  };
}

export async function sendPaymentCheck(booking: BookingRow) {
  const { subject, html, text } = buildPaymentCheck(booking);

  await sendEmail({
    from: process.env.RESEND_FROM_EMAIL!,
    to: ownerEmails(),
    // Antwoordt de eigenaar op deze mail, dan komt dat bij de gást terecht —
    // en dat is precies wat je wilt als het antwoord "ik bel ze even" is.
    replyTo: booking.email,
    subject,
    html,
    text,
  });
}
