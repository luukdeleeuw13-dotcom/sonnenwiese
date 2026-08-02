import type { BookingRow, InquiryRow } from "@/lib/supabase/types";

// De reserveringen en de vragen zijn de enige onvervangbare gegevens op de
// site — de rest staat in Git. Het gratis Supabase-plan maakt geen
// automatische back-ups, dus maken we ze zelf: één keer per week per mail
// (api/cron/backup) en met een knop in het beheerscherm (admin/export).
// Beide gebruiken deze ene bouwer, zodat de wekelijkse mail en de knop
// nooit uit elkaar kunnen gaan lopen.

export const BOOKING_COLUMNS: (keyof BookingRow)[] = [
  "created_at",
  "status",
  "start_date",
  "end_date",
  "guests",
  "full_name",
  "email",
  "phone",
  "message",
  "locale",
  // Nota en betaling: wat er afgesproken is en of het binnen is, hoort in een
  // back-up net zo goed thuis als de boeking zelf. Ontbreken de kolommen nog
  // (migratie 0003), dan blijven ze gewoon leeg.
  "price_cents",
  "invoice_required",
  "invoice_sent_at",
  "paid_at",
];

export const INQUIRY_COLUMNS: (keyof InquiryRow)[] = [
  "created_at",
  "full_name",
  "email",
  "phone",
  "period",
  "message",
  "locale",
  "handled",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  // Excel voert een cel die met = of @ begint uit als formule. Een gast die
  // zijn bericht met "=" begint hoort geen rekensom in de back-up van de
  // eigenaar te worden; een apostrof ervoor maakt er weer gewone tekst van.
  // Het plusteken hoort in dat rijtje thuis maar staat er bewust niet bij:
  // elk buitenlands telefoonnummer begint ermee, en die allemaal met een
  // apostrof in de kolom zetten is een grotere kwaal dan de kwaal.
  if (/^[=@]/.test(text)) text = `'${text}`;
  // Aanhalingstekens verdubbelen en het geheel quoten: dat is genoeg voor
  // komma's, puntkomma's en regeleinden in bv. het berichtveld.
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv<T>(columns: (keyof T)[], rows: T[]): string {
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((c) => csvCell(row[c])).join(",")),
  ].join("\r\n");
}

// Excel leest een CSV pas met de juiste accenten als er een byte order mark
// voor staat. Alleen voor bestanden die iemand echt opent — niet nodig, maar
// wel het verschil tussen "Müller" en "MÃ¼ller".
export function withBom(csv: string): string {
  return `﻿${csv}`;
}

export function stamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
