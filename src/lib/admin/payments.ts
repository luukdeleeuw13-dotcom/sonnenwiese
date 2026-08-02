import { addDays, differenceInCalendarDays, format } from "date-fns";
import type { BookingRow } from "@/lib/supabase/types";

// De nota gaat twee weken voor aankomst de deur uit; betalen mag tot de dag
// dat ze de sleutel krijgen.
export const INVOICE_LEAD_DAYS = 14;

export type PaymentState =
  | "notRequired" // familie: er komt geen nota
  | "paid" // binnen
  | "sent" // nota verstuurd, nog niet betaald
  | "todo"; // nog geen nota verstuurd

// Of de migratie met de nota-kolommen al gedraaid heeft. Zonder die kolommen
// stuurt Supabase de velden helemaal niet mee, en dan zou het scherm bij elke
// boeking "nog geen nota" roepen terwijl het in werkelijkheid niets weet.
export function hasPaymentColumns(booking: BookingRow): boolean {
  return "invoice_required" in booking;
}

export function paymentState(booking: BookingRow): PaymentState {
  if (booking.invoice_required === false) return "notRequired";
  if (booking.paid_at) return "paid";
  if (booking.invoice_sent_at) return "sent";
  return "todo";
}

// Datum waarop de nota verstuurd zou moeten zijn.
export function invoiceDueDate(booking: BookingRow): string {
  const start = new Date(`${booking.start_date}T00:00:00`);
  return format(addDays(start, -INVOICE_LEAD_DAYS), "yyyy-MM-dd");
}

// Hele dagen tot een datum, vanaf vandaag. Bewust kalenderdagen en geen
// klokuren: wie vanavond laat kijkt, moet niet lezen dat de gast "over 0
// dagen" komt terwijl het morgen is.
export function daysUntil(date: string, from = new Date()): number {
  return differenceInCalendarDays(new Date(`${date}T00:00:00`), from);
}

// Vraagt dit verblijf nu aandacht? Twee gevallen: de nota had al verstuurd
// moeten zijn, of ze staan bijna op de stoep zonder dat er betaald is.
export function needsAttention(booking: BookingRow, today: string): boolean {
  const state = paymentState(booking);
  if (state === "notRequired" || state === "paid") return false;
  if (state === "todo") return today >= invoiceDueDate(booking);
  return daysUntil(booking.start_date) <= 2;
}

// Bedragen staan in centen in de database; hier gaan ze naar en van het
// scherm. Losse functies omdat de invoer met de hand komt: iemand typt
// "1.250" net zo goed als "1250,00".
export function formatEuro(cents: number): string {
  return (cents / 100).toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

// Invoer naar centen. `null` betekent "leeg" (bedrag wissen), `undefined`
// betekent "hier kan ik geen bedrag in herkennen" — die twee mogen niet op
// hetzelfde neerkomen, anders wist een typefout stilletjes de prijs.
export function parseEuro(raw: string): number | null | undefined {
  const trimmed = raw.trim().replace(/^€\s*/, "");
  if (!trimmed) return null;

  // Nederlandse notatie: punt is duizendtal, komma is decimaal. Staat er
  // alleen een punt, dan is dat een decimaalteken (1250.00) tenzij er precies
  // drie cijfers achter staan (1.250).
  let normalised = trimmed.replace(/\s/g, "");
  if (normalised.includes(",")) {
    normalised = normalised.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(normalised)) {
    normalised = normalised.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalised)) return undefined;
  return Math.round(Number(normalised) * 100);
}
