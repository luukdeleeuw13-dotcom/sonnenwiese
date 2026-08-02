import { NextResponse } from "next/server";
import { validateInquiry } from "@/lib/validation/inquiry";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { sendInquiryNotification } from "@/lib/email/sendInquiryNotification";
import { clientKey, isRateLimited } from "@/lib/rateLimit";

export async function POST(request: Request) {
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { message: "messageRequired" } },
      { status: 400 }
    );
  }

  // Honeypot, net als bij het boekingsformulier: ingevuld = bot. Doe alsof
  // het gelukt is, sla niets op.
  if (
    typeof (body as Record<string, unknown>)?.["website"] === "string" &&
    ((body as Record<string, unknown>)["website"] as string).length > 0
  ) {
    return NextResponse.json({ ok: true });
  }

  const result = validateInquiry(body);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, errors: result.errors },
      { status: 400 }
    );
  }
  const inquiry = result.data;

  if (!isSupabaseConfigured()) {
    console.error("Vraag ontvangen maar Supabase is niet geconfigureerd");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("inquiries").insert({
    full_name: inquiry.fullName,
    email: inquiry.email,
    phone: inquiry.phone ?? null,
    period: inquiry.period ?? null,
    message: inquiry.message,
    locale: inquiry.locale,
  });

  if (error) {
    console.error("Vraag opslaan mislukt:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // Zelfde afweging als bij een boekingsaanvraag: de vraag staat veilig in
  // de database, dus een mislukte mail mag het formulier niet laten
  // struikelen. Eén keer opnieuw proberen, daarna luid loggen — de vraag is
  // dan nog steeds zichtbaar op /admin.
  try {
    await sendInquiryNotification(inquiry);
  } catch (firstError) {
    console.error("Melding van vraag mislukt, één nieuwe poging:", firstError);
    try {
      await sendInquiryNotification(inquiry);
    } catch (mailError) {
      console.error(
        "VRAAG ZONDER MAIL — staat wel in de database maar de eigenaar " +
          "is niet gemaild:",
        mailError
      );
    }
  }

  return NextResponse.json({ ok: true });
}
