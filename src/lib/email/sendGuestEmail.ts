import { Resend } from "resend";
import { format } from "date-fns";
import { nl, de, enGB } from "date-fns/locale";
import { SITE_URL } from "@/lib/config";
import type { BookingRow } from "@/lib/supabase/types";

const dateLocales = { nl, de, en: enGB } as const;

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
  const locale = (
    ["nl", "de", "en"].includes(booking.locale) ? booking.locale : "nl"
  ) as keyof typeof dateLocales;

  const messages: EmailMessages = (
    await import(`../../../messages/${locale}.json`)
  ).default.email;

  const fmt = (d: string) =>
    format(new Date(`${d}T00:00:00`), "d MMMM yyyy", {
      locale: dateLocales[locale],
    });

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

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: booking.email,
    replyTo: process.env.OWNER_NOTIFICATION_EMAIL,
    subject,
    text: body,
  });
}
