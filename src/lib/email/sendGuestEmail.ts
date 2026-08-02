import { sendEmail } from "./send";
import { emailLocale, formatLongDate } from "./localeDate";
import { SITE_URL, ownerEmails } from "@/lib/config";
import type { BookingRow } from "@/lib/supabase/types";

type EmailMessages = {
  confirmSubject: string;
  confirmBody: string;
  rejectSubject: string;
  rejectBody: string;
};

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

// Automatische bevestigings- of afwijsmail naar de gast, in de taal
// waarin de gast de aanvraag deed.
export async function sendGuestEmail(
  booking: Pick<
    BookingRow,
    "full_name" | "email" | "start_date" | "end_date" | "guests" | "locale"
  >,
  action: "confirmed" | "rejected"
) {
  const locale = emailLocale(booking.locale);

  const messages: EmailMessages = (
    await import(`../../../messages/${locale}.json`)
  ).default.email;

  const fmt = (d: string) => formatLongDate(d, locale);

  const vars = {
    name: booking.full_name,
    from: fmt(booking.start_date),
    to: fmt(booking.end_date),
    guests: String(booking.guests),
    siteUrl: `${SITE_URL}/${locale}`,
  };

  const subject = fill(
    action === "confirmed" ? messages.confirmSubject : messages.rejectSubject,
    vars
  );
  const body = fill(
    action === "confirmed" ? messages.confirmBody : messages.rejectBody,
    vars
  );

  await sendEmail({
    from: process.env.RESEND_FROM_EMAIL!,
    to: booking.email,
    // Antwoordt de gast op de bevestiging, dan komt dat bij iedereen die
    // meekijkt binnen — niet alleen bij wie toevallig geaccepteerd heeft.
    replyTo: ownerEmails(),
    subject,
    text: body,
  });
}
