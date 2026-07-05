import { NextResponse } from "next/server";
import { validateBooking } from "@/lib/validation/booking";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { sendBookingNotification } from "@/lib/email/sendBookingNotification";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, errors: { dates: "datesRequired" } },
      { status: 400 }
    );
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
  // aanvraag voor de gast niet laten mislukken. Alleen loggen.
  try {
    await sendBookingNotification(booking, data.id);
  } catch (mailError) {
    console.error("Failed to send owner notification email:", mailError);
  }

  return NextResponse.json({ ok: true, id: data.id });
}
