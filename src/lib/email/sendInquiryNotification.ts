import { sendEmail } from "./send";
import { SITE_URL, ownerEmails } from "@/lib/config";
import type { InquiryInput } from "@/lib/supabase/types";

// Mailt de eigenaren bij een nieuwe vraag. Bewust zónder accepteer- of
// afwijsknop: een vraag is geen aanvraag en mag niets in de kalender
// blokkeren. Antwoorden gaat gewoon met de antwoordknop van de mail —
// replyTo staat op de vragensteller.
export async function sendInquiryNotification(inquiry: InquiryInput) {
  const rows: [string, string][] = [
    ["Naam", inquiry.fullName],
    ["E-mail", inquiry.email],
    ["Telefoon", inquiry.phone ?? "-"],
    ["Periode", inquiry.period ?? "-"],
    ["Taal", inquiry.locale],
  ];

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `
  <div style="font-family: Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #4a3728;">
    <h2 style="font-family: Georgia, serif;">Nieuwe vraag via de site</h2>
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
    <p style="background: #f5efe3; border-radius: 8px; padding: 14px 16px; white-space: pre-wrap; line-height: 1.6;">${esc(
      inquiry.message
    )}</p>
    <p style="color: #7c5c42; font-size: 14px;">
      Dit is een vraag, geen boekingsaanvraag: er staat niets in de agenda
      en er is niets geblokkeerd. Antwoorden op deze mail komt rechtstreeks
      bij ${esc(inquiry.fullName)} terecht.
    </p>
    <p style="font-size: 14px;">
      <a href="${SITE_URL}/admin" style="color: #55663e;">Alle vragen en aanvragen bekijken →</a>
    </p>
  </div>`;

  const text = [
    "Nieuwe vraag via sonnenwiese.nl",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    inquiry.message,
    "",
    "Dit is een vraag, geen boekingsaanvraag — er is niets geblokkeerd.",
    `Overzicht: ${SITE_URL}/admin`,
  ].join("\n");

  await sendEmail({
    from: process.env.RESEND_FROM_EMAIL!,
    to: ownerEmails(),
    replyTo: inquiry.email,
    subject: `Vraag van ${inquiry.fullName}${
      inquiry.period ? ` (${inquiry.period})` : ""
    }`,
    html,
    text,
  });
}
