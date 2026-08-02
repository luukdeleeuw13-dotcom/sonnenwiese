import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import {
  BOOKING_COLUMNS,
  INQUIRY_COLUMNS,
  stamp,
  toCsv,
  withBom,
} from "@/lib/backup/csv";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { BookingRow, InquiryRow } from "@/lib/supabase/types";

// Back-up met de hand: één klik in het beheerscherm. Dezelfde gegevens die
// de wekelijkse mail meestuurt (zie api/cron/backup) — deze knop is er voor
// het moment dat je niet wilt wachten tot zondag.
//
// ?tabel=vragen geeft de vragen in plaats van de boekingen.

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return new NextResponse("Niet ingelogd", { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return new NextResponse("Supabase is niet geconfigureerd", { status: 500 });
  }

  const wantsInquiries =
    new URL(request.url).searchParams.get("tabel") === "vragen";
  const table = wantsInquiries ? "inquiries" : "bookings";
  const orderBy = wantsInquiries ? "created_at" : "start_date";

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order(orderBy, { ascending: true });

  if (error) {
    console.error("CSV-export mislukt:", error);
    return new NextResponse("Export mislukt", { status: 500 });
  }

  const csv = wantsInquiries
    ? toCsv(INQUIRY_COLUMNS, (data ?? []) as InquiryRow[])
    : toCsv(BOOKING_COLUMNS, (data ?? []) as BookingRow[]);
  const name = wantsInquiries ? "vragen" : "boekingen";

  return new NextResponse(withBom(csv), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sonnenwiese-${name}-${stamp()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
