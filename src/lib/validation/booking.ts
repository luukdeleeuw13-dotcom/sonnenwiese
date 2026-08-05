import type { BookingInput } from "@/lib/supabase/types";
import { isChangeoverDate } from "@/lib/booking/weeks";
import { MAX_GUESTS } from "@/lib/booking/capacity";

const LOCALES = ["nl", "de", "en"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Foutcodes corresponderen met de keys in bookingForm.validation in de
// messages-bestanden, zodat de client ze direct kan vertalen.
export type BookingValidationErrors = Partial<
  Record<"fullName" | "email" | "dates" | "guests", string>
>;

export type BookingValidationResult =
  | { ok: true; data: BookingInput }
  | { ok: false; errors: BookingValidationErrors };

function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function validateBooking(raw: unknown): BookingValidationResult {
  const errors: BookingValidationErrors = {};
  const body = (raw ?? {}) as Record<string, unknown>;

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) errors.fullName = "nameRequired";

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) errors.email = "emailRequired";
  else if (!EMAIL_RE.test(email)) errors.email = "emailInvalid";

  const startDate = typeof body.startDate === "string" ? body.startDate : "";
  const endDate = typeof body.endDate === "string" ? body.endDate : "";
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    errors.dates = "datesRequired";
  } else if (endDate <= startDate) {
    errors.dates = "datesInvalid";
  } else {
    const today = new Date().toISOString().slice(0, 10);
    if (startDate < today) errors.dates = "datesPast";
    // De kalender laat alleen hele weken kiezen, maar de kalender is maar
    // een hulpmiddel: wie het formulier omzeilt zou anders alsnog een halve
    // week in de agenda kunnen zetten.
    else if (!isChangeoverDate(startDate) || !isChangeoverDate(endDate)) {
      errors.dates = "datesWholeWeeks";
    }
  }

  const guests = typeof body.guests === "number" ? body.guests : NaN;
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) {
    errors.guests = "guestsInvalid";
  }

  const locale = LOCALES.includes(body.locale as (typeof LOCALES)[number])
    ? (body.locale as BookingInput["locale"])
    : "nl";

  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim().slice(0, 50)
      : undefined;
  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim().slice(0, 2000)
      : undefined;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      fullName: fullName.slice(0, 200),
      email: email.slice(0, 200),
      phone,
      startDate,
      endDate,
      guests,
      message,
      locale,
    },
  };
}
