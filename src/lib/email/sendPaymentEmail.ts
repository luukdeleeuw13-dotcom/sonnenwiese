import { sendEmail } from "./send";
import { emailLocale, formatLongDate } from "./localeDate";
import { SITE_URL, ownerEmails, paymentDetails } from "@/lib/config";
import { paymentDueDate } from "@/lib/admin/payments";
import type { BookingRow } from "@/lib/supabase/types";

// Bedragen worden per taal anders geschreven: € 1.850 is voor een Engelse
// lezer € 1,85. Bij een betaalverzoek is dat geen schoonheidsfoutje maar een
// factor duizend, dus de gasttaal bepaalt hier de notatie.
const numberLocales = { nl: "nl-NL", de: "de-AT", en: "en-GB" } as const;

export type PaymentEmailKind =
  | "request" // het betaalverzoek zelf
  | "reminder" // de eigenaar zag het geld nog niet
  | "received"; // de eigenaar bevestigde dat het binnen is

type PaymentBooking = Pick<
  BookingRow,
  "full_name" | "email" | "start_date" | "end_date" | "locale" | "price_cents"
>;

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

// Wat de gast in zijn bankapp bij de omschrijving zet. Naam én aankomstdatum,
// zodat een overboeking op het afschrift ook zonder deze mail terug te vinden
// is bij het juiste verblijf.
export function paymentReference(booking: PaymentBooking): string {
  return `Sonnenwiese ${booking.start_date} ${booking.full_name}`;
}

// Het opstellen staat los van het versturen, zodat je kunt nakijken wat er
// straks in iemands inbox valt zonder dat er iets de deur uit gaat.
//
// Alle drie de mails weigeren te vertrekken zonder bedrag of rekeninggegevens.
// Een betaalverzoek zonder rekeningnummer laat de gast achter met een plicht
// en zonder adres — dan is een zichtbare fout in de logs beter dan een mail
// die er goed uitziet.
export async function buildPaymentEmail(
  booking: PaymentBooking,
  kind: PaymentEmailKind
): Promise<{ subject: string; text: string }> {
  const details = paymentDetails();
  if (!details) {
    throw new Error(
      "OWNER_IBAN of OWNER_ACCOUNT_NAME ontbreekt — geen betaalgegevens om te versturen"
    );
  }
  if (typeof booking.price_cents !== "number") {
    throw new Error("Deze boeking heeft nog geen bedrag");
  }

  const locale = emailLocale(booking.locale);

  const messages = (await import(`../../../messages/${locale}.json`)).default
    .email as Record<string, string>;

  const fmt = (d: string) => formatLongDate(d, locale);

  const vars = {
    name: booking.full_name,
    from: fmt(booking.start_date),
    to: fmt(booking.end_date),
    amount: (booking.price_cents / 100).toLocaleString(numberLocales[locale], {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: booking.price_cents % 100 === 0 ? 0 : 2,
    }),
    iban: details.iban,
    accountName: details.accountName,
    reference: paymentReference(booking),
    due: fmt(paymentDueDate(booking.start_date)),
    siteUrl: `${SITE_URL}/${locale}`,
  };

  const prefix =
    kind === "request"
      ? "payment"
      : kind === "reminder"
        ? "reminder"
        : "received";

  return {
    subject: fill(messages[`${prefix}Subject`], vars),
    text: fill(messages[`${prefix}Body`], vars),
  };
}

// Betaalverzoek, herinnering of bevestiging naar de gast, in de taal waarin
// de aanvraag binnenkwam.
export async function sendPaymentEmail(
  booking: PaymentBooking,
  kind: PaymentEmailKind
) {
  const { subject, text } = await buildPaymentEmail(booking, kind);

  await sendEmail({
    from: process.env.RESEND_FROM_EMAIL!,
    to: booking.email,
    // Antwoordt de gast ("ik heb vorige week al betaald"), dan komt dat bij
    // iedereen die meekijkt binnen — precies het geval waarvoor je die mail
    // niet wilt missen.
    replyTo: ownerEmails(),
    subject,
    text,
  });
}
