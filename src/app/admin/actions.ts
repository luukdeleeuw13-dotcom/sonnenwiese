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
  const isBlock =
    booking.email === process.env.OWNER_NOTIFICATION_EMAIL &&
    booking.guests === 1 &&
    !booking.message;
  if (!isBlock) {
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
    email: process.env.OWNER_NOTIFICATION_EMAIL ?? "eigenaar@sonnenwiese.nl",
    locale: "nl",
  });
  if (error) console.error("Admin: block failed:", error);
  revalidatePath("/admin");
}
