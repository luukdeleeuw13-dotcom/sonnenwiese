import { createHmac, timingSafeEqual } from "crypto";

// Token voor de accepteer/afwijs-links in de eigenaarsmail. Afgeleid via
// HMAC van het boekings-ID met een servergeheim: zonder het geheim is er
// geen geldige link te maken, en er hoeft niets extra's in de database.
function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ontbreekt");
  return key;
}

export function createActionToken(bookingId: string): string {
  return createHmac("sha256", secret())
    .update(`booking-action:${bookingId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyActionToken(bookingId: string, token: string): boolean {
  const expected = Buffer.from(createActionToken(bookingId));
  const provided = Buffer.from(token);
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}
