import type { InquiryInput } from "@/lib/supabase/types";

const LOCALES = ["nl", "de", "en"] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Foutcodes corresponderen met de keys in inquiry.validation in de
// messages-bestanden, zodat de client ze direct kan vertalen.
export type InquiryValidationErrors = Partial<
  Record<"fullName" | "email" | "message", string>
>;

export type InquiryValidationResult =
  | { ok: true; data: InquiryInput }
  | { ok: false; errors: InquiryValidationErrors };

// Een vraag stelt bewust minder eisen dan een boekingsaanvraag: geen
// datums, geen aantal personen. Alleen wie je bent, waar we je bereiken en
// wat je wilt weten — anders kunnen we niet antwoorden.
export function validateInquiry(raw: unknown): InquiryValidationResult {
  const errors: InquiryValidationErrors = {};
  const body = (raw ?? {}) as Record<string, unknown>;

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) errors.fullName = "nameRequired";

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) errors.email = "emailRequired";
  else if (!EMAIL_RE.test(email)) errors.email = "emailInvalid";

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) errors.message = "messageRequired";

  const locale = LOCALES.includes(body.locale as (typeof LOCALES)[number])
    ? (body.locale as InquiryInput["locale"])
    : "nl";

  const phone =
    typeof body.phone === "string" && body.phone.trim()
      ? body.phone.trim().slice(0, 50)
      : undefined;
  const period =
    typeof body.period === "string" && body.period.trim()
      ? body.period.trim().slice(0, 200)
      : undefined;

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      fullName: fullName.slice(0, 200),
      email: email.slice(0, 200),
      phone,
      period,
      message: message.slice(0, 2000),
      locale,
    },
  };
}
