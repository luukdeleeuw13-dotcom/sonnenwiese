import { createHmac, timingSafeEqual } from "crypto";

// Tokens voor de knoppen in de eigenaarsmail. Afgeleid via HMAC van het
// boekings-ID met een servergeheim: zonder het geheim is er geen geldige link
// te maken, en er hoeft niets extra's in de database.
function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt");
  return key;
}

// Het doel wordt mee-ondertekend. Daardoor opent de accepteerlink uit een oude
// mail niet óók de betaalvraag: elke knop heeft zijn eigen sleutel, en een
// doorgestuurde mail geeft nooit meer weg dan die ene handeling.
function sign(purpose: string, bookingId: string): string {
  return createHmac("sha256", secret())
    .update(`${purpose}:${bookingId}`)
    .digest("hex")
    .slice(0, 32);
}

function matches(expected: string, provided: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createActionToken(bookingId: string): string {
  return sign("booking-action", bookingId);
}

export function verifyActionToken(bookingId: string, token: string): boolean {
  return matches(createActionToken(bookingId), token);
}

export function createPaymentToken(bookingId: string): string {
  return sign("payment-answer", bookingId);
}

export function verifyPaymentToken(bookingId: string, token: string): boolean {
  return matches(createPaymentToken(bookingId), token);
}
