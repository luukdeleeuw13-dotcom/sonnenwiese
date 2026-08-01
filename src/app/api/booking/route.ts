import { NextResponse } from "next/server";
import { validateBooking } from "@/lib/validation/booking";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { sendBookingNotification } from "@/lib/email/sendBookingNotification";
import { clientKey, isRateLimited } from "@/lib/rateLimit";

export async function POST(request: Request) {
  // De honeypot vangt domme bots; dit vangt iemand die het formulier
  // gericht blijft inschieten.
  if (isRateLimited(clientKey(request))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { dates: "datesRequired" } },
      { status: 400 }
    );
  }

  // Honeypot: echte bezoekers zien dit veld niet. Is het ingevuld, dan is
  // het een bot — doe alsof alles gelukt is, maar sla niets op.
  if (
    typeof (body as Record<string, unknown>)?.["website"] === "string" &&
    ((body as Record<string, unknown>)["website"] as string).length > 0
  ) {
    return NextResponse.json({ ok: true, id: "ok" });
  }

  const result = validateBooking(body);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, errors: result.errors },
      { status: 400 }
    );
  }
  const booking = result.data;

  if (!isSupabaseConfigured()) {
    console.error("Booking request received but Supabase is not configured");
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const supabase = getSupabaseServerClient();

  // Weiger aanvragen die overlappen met een al bevestigde boeking. De
  // kalender blokkeert dit ook client-side, maar de server is de waarheid.
  const { data: overlapping, error: overlapError } = await supabase
    .from("bookings")
    .select("id")
    .eq("status", "confirmed")
    .lt("start_date", booking.endDate)
    .gt("end_date", booking.startDate)
    .limit(1);

  if (overlapError) {
    console.error("Failed to check overlap:", overlapError);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  if (overlapping && overlapping.length > 0) {
    return NextResponse.json(
      { ok: false, errors: { dates: "datesUnavailable" } },
      { status: 409 }
    );
  }
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      status: "pending",
      start_date: booking.startDate,
      end_date: booking.endDate,
      guests: booking.guests,
      full_name: booking.fullName,
      email: booking.email,
      phone: booking.phone ?? null,
      message: booking.message ?? null,
      locale: booking.locale,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Failed to insert booking:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // De aanvraag staat veilig in de database; een mislukte mail mag de
  // aanvraag voor de gast niet laten mislukken. Wel één keer opnieuw
  // proberen: de meeste mailfouten zijn tijdelijk. Lukt het dan nog niet,
  // dan is de aanvraag nog steeds zichtbaar op /admin.
  try {
    await sendBookingNotification(booking, data.id);
  } catch (firstError) {
    console.error("Owner notification failed, retrying once:", firstError);
    try {
      await sendBookingNotification(booking, data.id);
    } catch (mailError) {
      console.error(
        `AANVRAAG ZONDER MAIL — id ${data.id} staat wel in de database ` +
          `maar de eigenaar is niet gemaild:`,
        mailError
      );
    }
  }

  return NextResponse.json({ ok: true, id: data.id });
}
