import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin/auth";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { BookingRow } from "@/lib/supabase/types";

// Back-up van de boekingen als CSV.
//
// De reserveringen zijn de enige onvervangbare gegevens op de site — de
// rest staat in Git. Het gratis Supabase-plan maakt geen automatische
// back-ups, dus dit is de handmatige uitweg: één klik in het beheerscherm.

const COLUMNS: (keyof BookingRow)[] = [
  "created_at",
  "status",
  "start_date",
  "end_date",
  "guests",
  "full_name",
  "email",
  "phone",
  "message",
  "locale",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  // Aanhalingstekens verdubbelen en het geheel quoten: dat is genoeg voor
  // komma's, puntkomma's en regeleinden in bv. het berichtveld.
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET() {
  if (!(await isAdmin())) {
    return new NextResponse("Niet ingelogd", { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return new NextResponse("Supabase is niet geconfigureerd", { status: 500 });
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    console.error("CSV-export mislukt:", error);
    return new NextResponse("Export mislukt", { status: 500 });
  }

  const rows = (data ?? []) as BookingRow[];
  const csv = [
    COLUMNS.join(","),
    ...rows.map((row) => COLUMNS.map((c) => csvCell(row[c])).join(",")),
  ].join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${csv}`, {
    headers: {
      // BOM ervoor zodat Excel de accenten goed leest.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sonnenwiese-boekingen-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
