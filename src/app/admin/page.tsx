import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin/auth";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { BookingRow } from "@/lib/supabase/types";
import {
  login,
  logout,
  setBookingStatus,
  deleteBooking,
  blockPeriod,
} from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Beheer — Sonnenwiese",
  robots: { index: false, follow: false },
};

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: "Nieuw", className: "bg-sun/20 text-sun-dark" },
  confirmed: { label: "Bevestigd", className: "bg-meadow/20 text-meadow-dark" },
  rejected: { label: "Afgewezen", className: "bg-sand text-timber" },
};

function fmtDate(d: string): string {
  return new Date(`${d}T00:00:00`).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function BookingCard({ booking }: { booking: BookingRow }) {
  const status = statusLabels[booking.status] ?? statusLabels.pending;
  // Handmatige blokkades: aangemaakt via het blokkeer-formulier (eigen
  // e-mailadres, 1 "gast", geen bericht, direct bevestigd).
  const isBlock =
    booking.email === process.env.OWNER_NOTIFICATION_EMAIL &&
    booking.status === "confirmed" &&
    booking.guests === 1 &&
    !booking.message;

  return (
    <div className="rounded-card border border-sand bg-snow p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-bark">
          {fmtDate(booking.start_date)} — {fmtDate(booking.end_date)}
        </p>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
        >
          {isBlock ? "Blokkade" : status.label}
        </span>
      </div>
      <p className="mt-1 text-sm text-timber">
        {booking.full_name}
        {!isBlock && <> · {booking.guests} pers. · {booking.locale}</>}
      </p>
      {!isBlock && (
        <p className="mt-1 text-sm text-timber">
          <a href={`mailto:${booking.email}`} className="underline-offset-2 hover:underline">
            {booking.email}
          </a>
          {booking.phone && <> · {booking.phone}</>}
        </p>
      )}
      {booking.message && (
        <p className="mt-2 rounded-lg bg-cream px-3 py-2 text-sm text-timber">
          {booking.message}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {booking.status !== "confirmed" && (
          <form action={setBookingStatus}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="status" value="confirmed" />
            <button className="rounded-lg bg-meadow px-4 py-2 text-sm font-semibold text-snow hover:bg-meadow-dark">
              ✓ Accepteren
            </button>
          </form>
        )}
        {booking.status !== "rejected" && (
          <form action={setBookingStatus}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="status" value="rejected" />
            <button className="rounded-lg border border-sand bg-cream px-4 py-2 text-sm font-semibold text-timber hover:border-timber">
              ✗ Afwijzen
            </button>
          </form>
        )}
        <form action={deleteBooking}>
          <input type="hidden" name="id" value={booking.id} />
          <button className="rounded-lg px-3 py-2 text-sm text-timber/70 hover:text-red-700">
            Verwijderen
          </button>
        </form>
      </div>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ fout?: string }>;
}) {
  const loggedIn = await isAdmin();
  const { fout } = await searchParams;

  if (!loggedIn) {
    return (
      <div className="mx-auto max-w-sm px-4 py-20">
        <h1 className="font-display text-3xl font-semibold text-bark">
          Beheer
        </h1>
        <p className="mt-2 text-timber">
          Log in om aanvragen en boekingen te beheren.
        </p>
        <form action={login} className="mt-6">
          <label className="block">
            <span className="text-sm font-medium text-bark">Wachtwoord</span>
            <input
              type="password"
              name="password"
              autoFocus
              className="mt-1 w-full rounded-lg border border-sand bg-snow px-3 py-2.5 text-bark focus:border-meadow focus:outline-none"
            />
          </label>
          {fout && (
            <p className="mt-2 text-sm text-red-700">
              Onjuist wachtwoord, probeer het opnieuw.
            </p>
          )}
          <button className="mt-4 w-full rounded-lg bg-sun px-6 py-3 font-semibold text-snow hover:bg-sun-dark">
            Inloggen
          </button>
        </form>
      </div>
    );
  }

  if (!isSupabaseConfigured()) {
    return <p className="p-8 text-timber">Supabase is niet geconfigureerd.</p>;
  }

  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .order("start_date", { ascending: true });
  const bookings = (data ?? []) as BookingRow[];

  const today = new Date().toISOString().slice(0, 10);
  const pending = bookings.filter((b) => b.status === "pending");
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.end_date >= today
  );
  const rest = bookings.filter(
    (b) =>
      b.status === "rejected" ||
      (b.status === "confirmed" && b.end_date < today)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-bark">
          Beheer
        </h1>
        <div className="flex items-center gap-4">
          {/* Bewust een gewone <a>: /admin/export is geen pagina maar een
              CSV-download. Met <Link> zou Next client-side willen navigeren
              en komt het bestand niet binnen. */}
          <a
            href="/admin/export"
            download
            className="text-sm text-timber underline-offset-2 hover:underline"
          >
            Back-up downloaden
          </a>
          <form action={logout}>
            <button className="text-sm text-timber underline-offset-2 hover:underline">
              Uitloggen
            </button>
          </form>
        </div>
      </div>

      <h2 className="mt-8 font-display text-xl font-semibold text-bark">
        Nieuwe aanvragen{" "}
        {pending.length > 0 && (
          <span className="ml-1 rounded-full bg-sun px-2.5 py-0.5 text-sm text-snow">
            {pending.length}
          </span>
        )}
      </h2>
      <div className="mt-3 space-y-3">
        {pending.length === 0 && (
          <p className="text-sm text-timber">Geen openstaande aanvragen. 🎉</p>
        )}
        {pending.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-bark">
        Komende boekingen & blokkades
      </h2>
      <div className="mt-3 space-y-3">
        {upcoming.length === 0 && (
          <p className="text-sm text-timber">Nog niets gepland.</p>
        )}
        {upcoming.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-bark">
        Periode blokkeren
      </h2>
      <p className="mt-1 text-sm text-timber">
        Voor eigen gebruik of onderhoud — verschijnt direct als bezet in de
        kalender.
      </p>
      <form
        action={blockPeriod}
        className="mt-3 flex flex-wrap items-end gap-3 rounded-card border border-sand bg-snow p-4"
      >
        <label className="block">
          <span className="text-sm font-medium text-bark">Van</span>
          <input
            type="date"
            name="startDate"
            required
            className="mt-1 block rounded-lg border border-sand bg-cream px-3 py-2 text-bark"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-bark">Tot</span>
          <input
            type="date"
            name="endDate"
            required
            className="mt-1 block rounded-lg border border-sand bg-cream px-3 py-2 text-bark"
          />
        </label>
        <label className="block grow">
          <span className="text-sm font-medium text-bark">Notitie</span>
          <input
            type="text"
            name="note"
            placeholder="bv. Eigen verblijf"
            className="mt-1 block w-full rounded-lg border border-sand bg-cream px-3 py-2 text-bark"
          />
        </label>
        <button className="rounded-lg bg-bark px-5 py-2.5 text-sm font-semibold text-snow hover:opacity-90">
          Blokkeren
        </button>
      </form>

      {rest.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-xl font-semibold text-bark">
            Afgewezen & voorbij
          </h2>
          <div className="mt-3 space-y-3">
            {rest.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
