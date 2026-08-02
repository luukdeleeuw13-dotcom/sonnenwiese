import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { isOwnerBlock } from "@/lib/admin/bookings";
import { paymentState } from "@/lib/admin/payments";
import type { BackupFile, BackupSummary } from "@/lib/email/sendBackupEmail";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingRow, InquiryRow } from "@/lib/supabase/types";
import {
  BOOKING_COLUMNS,
  INQUIRY_COLUMNS,
  stamp,
  toCsv,
  withBom,
} from "./csv";

// Alles verzamelen wat er in de back-up hoort. Los van de cron-route, zodat
// het na te lopen is zonder dat er een mail de deur uit gaat — de ontvangers
// zijn echte mensen en die zitten niet op testberichten te wachten.

function fmt(date: string): string {
  return format(new Date(`${date}T00:00:00`), "d MMMM", { locale: nl });
}

export async function collectBackup(
  supabase: SupabaseClient,
  now = new Date()
): Promise<{ summary: BackupSummary; files: BackupFile[] }> {
  const today = stamp(now);

  const [bookingsResult, inquiriesResult] = await Promise.all([
    supabase.from("bookings").select("*").order("start_date"),
    supabase.from("inquiries").select("*").order("created_at"),
  ]);

  if (bookingsResult.error) throw new Error(bookingsResult.error.message);
  if (inquiriesResult.error) throw new Error(inquiriesResult.error.message);

  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const inquiries = (inquiriesResult.data ?? []) as InquiryRow[];

  const confirmed = bookings.filter((b) => b.status === "confirmed");
  // Blokkades voor eigen gebruik tellen niet als bezoek en krijgen geen nota.
  const upcoming = confirmed.filter(
    (b) => b.end_date >= today && !isOwnerBlock(b)
  );
  const next = upcoming[0];

  const toSend = upcoming.filter((b) => paymentState(b) === "todo").length;
  const unpaid = upcoming.filter((b) => paymentState(b) === "sent").length;
  const openParts: string[] = [];
  if (toSend > 0) openParts.push(`${toSend} nog te versturen`);
  if (unpaid > 0) openParts.push(`${unpaid} nog niet betaald`);

  return {
    summary: {
      date: format(now, "d MMMM yyyy", { locale: nl }),
      bookings: bookings.length,
      confirmed: confirmed.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      inquiries: inquiries.length,
      nextStay: next
        ? `${next.full_name}, ${fmt(next.start_date)} — ${fmt(next.end_date)}`
        : null,
      openInvoices: openParts.length > 0 ? openParts.join(", ") : null,
    },
    files: [
      {
        filename: `sonnenwiese-boekingen-${today}.csv`,
        csv: withBom(toCsv(BOOKING_COLUMNS, bookings)),
      },
      {
        filename: `sonnenwiese-vragen-${today}.csv`,
        csv: withBom(toCsv(INQUIRY_COLUMNS, inquiries)),
      },
    ],
  };
}
