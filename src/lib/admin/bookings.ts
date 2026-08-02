import { ownerEmails } from "@/lib/config";
import type { BookingRow } from "@/lib/supabase/types";

// Een handmatige blokkade is geen gast: het blokkeer-formulier zet een gewone
// rij in dezelfde tabel, maar op het eigenaarsadres, met één "gast" en zonder
// bericht. Aan die drie dingen samen herkennen we hem.
//
// Bewust zónder statuscheck: bij het accepteren of afwijzen kijken we naar de
// rij zoals hij vóór de wijziging in de database stond, en dan zou de status
// het antwoord laten wisselen. Wie de status er wél bij wil hebben — de
// kaart en de wekenplanning tonen alleen bevestigde blokkades — zet die
// voorwaarde er zelf naast.
//
// Staat op één plek omdat de herkenning inmiddels op drie plekken nodig is.
// Uit elkaar lopende kopieën zouden betekenen dat een blokkade op de ene
// plek een gast heet en op de andere niet.
export function isOwnerBlock(
  booking: Pick<BookingRow, "email" | "guests" | "message">
): boolean {
  return (
    ownerEmails().includes(booking.email) &&
    booking.guests === 1 &&
    !booking.message
  );
}
