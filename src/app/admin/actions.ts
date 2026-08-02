"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  isAdmin,
  isPasswordCorrect,
  sessionToken,
} from "@/lib/admin/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendGuestEmail } from "@/lib/email/sendGuestEmail";
import { primaryOwnerEmail } from "@/lib/config";
import { isOwnerBlock } from "@/lib/admin/bookings";
import { parseEuro } from "@/lib/admin/payments";
import { estimatePrice } from "@/lib/booking/seasons";
import type { BookingRow } from "@/lib/supabase/types";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!isPasswordCorrect(password)) {
    redirect("/admin?fout=1");
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dagen
    path: "/",
  });
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin");
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

// Status wijzigen (accepteren/afwijzen) + automatische gastmail.
export async function setBookingStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "confirmed" && status !== "rejected")) return;

  const supabase = getSupabaseServerClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single<BookingRow>();
  if (!booking || booking.status === status) return;

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error("Admin: status update failed:", error);
    return;
  }

  // Handmatige blokkades (blokkeer-formulier) krijgen geen gastmail.
  if (!isOwnerBlock(booking)) {
    try {
      await sendGuestEmail(booking, status);
    } catch (e) {
      console.error("Admin: guest email failed:", e);
    }
  }
  revalidatePath("/admin");
}

export async function deleteBooking(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) console.error("Admin: delete failed:", error);
  revalidatePath("/admin");
}

// Een vraag als beantwoord markeren. Hij blijft staan tot de bewaartermijn
// hem opruimt — zo kun je terugzien wat er gevraagd is, zonder dat hij
// bovenaan in de weg blijft staan.
export async function setInquiryHandled(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const handled = String(formData.get("handled") ?? "") === "true";
  if (!id) return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ handled })
    .eq("id", id);
  if (error) console.error("Admin: vraag bijwerken mislukt:", error);
  revalidatePath("/admin");
}

export async function deleteInquiry(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) console.error("Admin: vraag verwijderen mislukt:", error);
  revalidatePath("/admin");
}

// Nota verstuurd / betaald aan- of uitzetten. We slaan het moment op en niet
// een vinkje, zodat je later terugziet wanneer het gebeurde.
export async function togglePaymentMoment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  const on = String(formData.get("value") ?? "") === "on";
  if (!id) return;
  if (field !== "invoice_sent_at" && field !== "paid_at") return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .update({ [field]: on ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) console.error("Admin: betaalstatus bijwerken mislukt:", error);
  revalidatePath("/admin");
}

// Familie krijgt geen nota. Zonder deze knop zou zo'n verblijf tot de dag van
// aankomst als onbetaald in het overzicht blijven staan.
export async function setInvoiceRequired(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const required = String(formData.get("value") ?? "") === "true";
  if (!id) return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .update({ invoice_required: required })
    .eq("id", id);
  if (error) console.error("Admin: notaplicht bijwerken mislukt:", error);
  revalidatePath("/admin");
}

// Het afgesproken bedrag, voorlopig met de hand ingevuld.
export async function setPrice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const cents = parseEuro(String(formData.get("price") ?? ""));
  // undefined betekent: hier staat iets wat geen bedrag is. Dan liever een
  // melding dan stilletjes de prijs wissen.
  if (cents === undefined) redirect("/admin?prijsfout=1");

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .update({ price_cents: cents })
    .eq("id", id);
  if (error) console.error("Admin: bedrag bijwerken mislukt:", error);
  revalidatePath("/admin");
}

// Het voorgestelde bedrag uit de seizoenstabel overnemen. Het bedrag komt
// bewust niet uit het formulier maar wordt hier opnieuw uitgerekend uit de
// datums in de database: een bedrag dat je van de browser aanneemt is een
// bedrag dat je niet kent.
export async function applySuggestedPrice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseServerClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("start_date,end_date")
    .eq("id", id)
    .single<Pick<BookingRow, "start_date" | "end_date">>();
  if (!booking) return;

  const estimate = estimatePrice(booking.start_date, booking.end_date);
  if (!estimate.ok) return;

  const { error } = await supabase
    .from("bookings")
    .update({ price_cents: estimate.totalCents })
    .eq("id", id);
  if (error) console.error("Admin: voorstel overnemen mislukt:", error);
  revalidatePath("/admin");
}

// Handmatig een periode blokkeren (eigen gebruik, familie, onderhoud):
// een gewone rij met status confirmed, herkenbaar aan het eigenaarsmailadres.
export async function blockPeriod(formData: FormData) {
  await requireAdmin();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return;
  if (endDate <= startDate) return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("bookings").insert({
    status: "confirmed",
    start_date: startDate,
    end_date: endDate,
    guests: 1,
    full_name: note || "Geblokkeerd door eigenaar",
    email: primaryOwnerEmail(),
    locale: "nl",
  });
  if (error) console.error("Admin: block failed:", error);
  revalidatePath("/admin");
}
