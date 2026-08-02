import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin/auth";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { BookingRow, InquiryRow } from "@/lib/supabase/types";
import { isOwnerBlock } from "@/lib/admin/bookings";
import { hasPaymentColumns } from "@/lib/admin/payments";
import WeekPlanner from "@/components/admin/WeekPlanner";
import NextGuest from "@/components/admin/NextGuest";
import PaymentStrip from "@/components/admin/PaymentStrip";
import {
  login,
  logout,
  setBookingStatus,
  deleteBooking,
  blockPeriod,
  setInquiryHandled,
  deleteInquiry,
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

function BookingCard({
  booking,
  today,
}: {
  booking: BookingRow;
  today: string;
}) {
  const status = statusLabels[booking.status] ?? statusLabels.pending;
  // Handmatige blokkades: aangemaakt via het blokkeer-formulier (eigen
  // e-mailadres, 1 "gast", geen bericht, direct bevestigd).
  const isBlock = booking.status === "confirmed" && isOwnerBlock(booking);
  // De nota hoort bij een afspraak die staat: een aanvraag die nog kan worden
  // afgewezen krijgt geen bedrag en geen betaalstatus.
  const showPayment =
    booking.status === "confirmed" &&
    !isBlock &&
    booking.end_date >= today &&
    hasPaymentColumns(booking);

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
      {showPayment && <PaymentStrip booking={booking} today={today} />}
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

function fmtMoment(value: string): string {
  return new Date(value).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// De onderwerpregel volgt de taal van de vraagsteller: die krijgt straks een
// antwoord in zijn eigen taal, dan hoort de kop daar niet Nederlands te zijn.
const replySubjects: Record<string, string> = {
  nl: "Je vraag over Sonnenwiese",
  de: "Deine Frage zu Sonnenwiese",
  en: "Your question about Sonnenwiese",
};

// Een vraag is geen aanvraag: geen accepteren, geen afwijzen, en niets in de
// kalender. Alleen beantwoorden — vandaar de mailto als voornaamste knop.
function InquiryCard({ inquiry }: { inquiry: InquiryRow }) {
  return (
    <div className="rounded-card border border-sand bg-snow p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-bark">{inquiry.full_name}</p>
        <span className="text-xs text-timber/70">
          {fmtMoment(inquiry.created_at)}
        </span>
      </div>
      <p className="mt-1 text-sm text-timber">
        <a
          href={`mailto:${inquiry.email}`}
          className="underline-offset-2 hover:underline"
        >
          {inquiry.email}
        </a>
        {inquiry.phone && <> · {inquiry.phone}</>}
        {" · "}
        {inquiry.locale}
      </p>
      {inquiry.period && (
        <p className="mt-1 text-sm text-timber">
          Periode: <span className="font-medium">{inquiry.period}</span>
        </p>
      )}
      <p className="mt-2 whitespace-pre-wrap rounded-lg bg-cream px-3 py-2 text-sm text-timber">
        {inquiry.message}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${inquiry.email}?subject=${encodeURIComponent(
            replySubjects[inquiry.locale] ?? replySubjects.nl
          )}`}
          className="rounded-lg bg-meadow px-4 py-2 text-sm font-semibold text-snow hover:bg-meadow-dark"
        >
          Beantwoorden
        </a>
        <form action={setInquiryHandled}>
          <input type="hidden" name="id" value={inquiry.id} />
          <input
            type="hidden"
            name="handled"
            value={inquiry.handled ? "false" : "true"}
          />
          <button className="rounded-lg border border-sand bg-cream px-4 py-2 text-sm font-semibold text-timber hover:border-timber">
            {inquiry.handled ? "↺ Heropenen" : "✓ Afgehandeld"}
          </button>
        </form>
        <form action={deleteInquiry}>
          <input type="hidden" name="id" value={inquiry.id} />
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
  searchParams: Promise<{ fout?: string; prijsfout?: string }>;
}) {
  const loggedIn = await isAdmin();
  const { fout, prijsfout } = await searchParams;

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
  const [bookingResult, inquiryResult] = await Promise.all([
    supabase.from("bookings").select("*").order("start_date", { ascending: true }),
    supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);
  const bookings = (bookingResult.data ?? []) as BookingRow[];
  const inquiries = (inquiryResult.data ?? []) as InquiryRow[];
  // Zolang migratie 0002 nog niet in Supabase is uitgevoerd, bestaat de
  // tabel niet. Dat stil als "geen vragen" tonen zou betekenen dat er
  // vragen binnenkomen die niemand ziet.
  const inquiriesBroken = Boolean(inquiryResult.error);
  if (inquiryResult.error) {
    console.error("Admin: vragen ophalen mislukt:", inquiryResult.error);
  }
  const openInquiries = inquiries.filter((i) => !i.handled);
  const handledInquiries = inquiries.filter((i) => i.handled);

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
  // Echte gasten: blokkades voor eigen gebruik komen niet logeren.
  const upcomingGuests = upcoming.filter((b) => !isOwnerBlock(b));
  // Net als bij de vragen: zolang migratie 0003 niet gedraaid heeft, bestaan
  // de nota-kolommen niet. Dan is "nog geen nota" geen feit maar een gok.
  const paymentsBroken =
    bookings.length > 0 && !bookings.some((b) => hasPaymentColumns(b));

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
            Boekingen downloaden
          </a>
          <a
            href="/admin/export?tabel=vragen"
            download
            className="text-sm text-timber underline-offset-2 hover:underline"
          >
            Vragen downloaden
          </a>
          <form action={logout}>
            <button className="text-sm text-timber underline-offset-2 hover:underline">
              Uitloggen
            </button>
          </form>
        </div>
      </div>

      <h2 className="mt-8 font-display text-xl font-semibold text-bark">
        Eerstkomende bezoek
      </h2>
      {paymentsBroken && (
        <p className="mt-3 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          De nota- en betaalstatus kan niet worden getoond. Is migratie{" "}
          <code>0003_payments.sql</code> al uitgevoerd in Supabase?
        </p>
      )}
      {prijsfout && (
        <p className="mt-3 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Dat bedrag kon ik niet lezen — er is niets gewijzigd. Schrijf het als{" "}
          <code>1250</code> of <code>1250,00</code>.
        </p>
      )}
      <NextGuest guests={upcomingGuests} today={today} />

      <h2 className="mt-10 font-display text-xl font-semibold text-bark">
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
          <BookingCard key={b.id} booking={b} today={today} />
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-bark">
        Vragen{" "}
        {openInquiries.length > 0 && (
          <span className="ml-1 rounded-full bg-sun px-2.5 py-0.5 text-sm text-snow">
            {openInquiries.length}
          </span>
        )}
      </h2>
      <div className="mt-3 space-y-3">
        {inquiriesBroken && (
          <p className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            De vragen konden niet worden opgehaald. Is migratie{" "}
            <code>0002_inquiries.sql</code> al uitgevoerd in Supabase?
          </p>
        )}
        {!inquiriesBroken && openInquiries.length === 0 && (
          <p className="text-sm text-timber">Geen openstaande vragen. 🎉</p>
        )}
        {openInquiries.map((i) => (
          <InquiryCard key={i.id} inquiry={i} />
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-bark">
        Wekenplanning
      </h2>
      <p className="mt-1 text-sm text-timber">
        Elk blokje is één verhuurweek, zaterdag tot zaterdag; het getal is de
        aankomstdatum. Ga er met de muis op staan (of tik erop) om te zien wie
        er ligt.
      </p>
      <WeekPlanner bookings={bookings} />

      <h2 className="mt-10 font-display text-xl font-semibold text-bark">
        Komende boekingen & blokkades
      </h2>
      <div className="mt-3 space-y-3">
        {upcoming.length === 0 && (
          <p className="text-sm text-timber">Nog niets gepland.</p>
        )}
        {upcoming.map((b) => (
          <BookingCard key={b.id} booking={b} today={today} />
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

      {handledInquiries.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-xl font-semibold text-bark">
            Afgehandelde vragen
          </h2>
          <div className="mt-3 space-y-3 opacity-75">
            {handledInquiries.map((i) => (
              <InquiryCard key={i.id} inquiry={i} />
            ))}
          </div>
        </>
      )}

      {rest.length > 0 && (
        <>
          <h2 className="mt-10 font-display text-xl font-semibold text-bark">
            Afgewezen & voorbij
          </h2>
          <div className="mt-3 space-y-3">
            {rest.map((b) => (
              <BookingCard key={b.id} booking={b} today={today} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
