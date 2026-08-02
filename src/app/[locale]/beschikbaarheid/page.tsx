import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { buildMetadata } from "@/lib/metadata";
import { Link } from "@/i18n/navigation";
import BookingSection, {
  type BookedRange,
} from "@/components/booking/BookingSection";

// Kalender moet altijd de actuele stand tonen — niet statisch cachen.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "availability" });
  return buildMetadata({
    locale,
    route: "beschikbaarheid",
    title: t("title"),
    description: t("intro"),
  });
}

type AvailabilityResult =
  | { ok: true; ranges: BookedRange[] }
  | { ok: false; ranges: never[] };

async function getConfirmedRanges(): Promise<AvailabilityResult> {
  // Zonder Supabase-configuratie (bv. lokale dev vóór het aanmaken van
  // accounts) toont de kalender gewoon alles als vrij.
  if (!isSupabaseConfigured()) return { ok: true, ranges: [] };

  try {
    const today = new Date().toISOString().slice(0, 10);
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("bookings")
      .select("start_date, end_date")
      .eq("status", "confirmed")
      .gte("end_date", today);

    if (error) {
      console.error("Failed to fetch confirmed bookings:", error);
      return { ok: false, ranges: [] };
    }
    return {
      ok: true,
      ranges: (data ?? []).map((row) => ({
        from: row.start_date,
        to: row.end_date,
      })),
    };
  } catch (e) {
    console.error("Failed to fetch confirmed bookings:", e);
    return { ok: false, ranges: [] };
  }
}

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("availability");
  const availability = await getConfirmedRanges();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-bark sm:text-4xl">
        {t("title")}
      </h1>
      {/* De intro verwijst naar de kalender; die tonen we niet als we de
          beschikbaarheid niet kunnen ophalen. */}
      {availability.ok && (
        <p className="mt-2 max-w-2xl text-timber">{t("intro")}</p>
      )}

      <BookingSection
        bookedRanges={availability.ranges}
        unavailable={!availability.ok}
      />

      {/* Staat bewust buiten BookingSection: juist als de kalender het niet
          doet, moet er nog een manier zijn om ons te bereiken. */}
      <section className="mt-10 rounded-card bg-sand/60 p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-bark sm:text-2xl">
          {t("questionTitle")}
        </h2>
        <p className="mt-2 max-w-2xl leading-relaxed text-timber">
          {t("questionText")}
        </p>
        <Link
          href="/vragen"
          className="mt-4 inline-block rounded-lg border border-timber/30 bg-snow px-5 py-3 text-sm font-semibold text-bark transition-colors hover:border-timber"
        >
          {t("questionCta")}
        </Link>
      </section>
    </div>
  );
}
