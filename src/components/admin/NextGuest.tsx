import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  daysUntil,
  hasPaymentColumns,
  needsAttention,
  paymentState,
} from "@/lib/admin/payments";
import PaymentStrip from "./PaymentStrip";
import type { BookingRow } from "@/lib/supabase/types";

function fmtLong(date: string): string {
  return format(new Date(`${date}T00:00:00`), "EEEE d MMMM yyyy", {
    locale: nl,
  });
}

// Wanneer komen ze, of zijn ze er al? In woorden, want "over 13 dagen" zegt
// meer dan een datum waar je zelf van moet aftrekken.
function timing(booking: BookingRow): { headline: string; note: string } {
  const toStart = daysUntil(booking.start_date);
  const toEnd = daysUntil(booking.end_date);

  if (toStart > 1) return { headline: `Over ${toStart} dagen`, note: "" };
  if (toStart === 1) return { headline: "Morgen", note: "" };
  if (toStart === 0) return { headline: "Vandaag", note: "aankomst" };
  if (toEnd === 0) return { headline: "Vertrekt vandaag", note: "" };
  return {
    headline: "Nu in huis",
    note: toEnd === 1 ? "vertrekt morgen" : `nog ${toEnd} dagen`,
  };
}

// Wat er over de hele voorraad komende verblijven nog te doen staat.
function todoLine(guests: BookingRow[], today: string): string | null {
  const toSend = guests.filter((b) => paymentState(b) === "todo").length;
  const unpaid = guests.filter((b) => paymentState(b) === "sent").length;
  const urgent = guests.filter((b) => needsAttention(b, today)).length;

  const parts: string[] = [];
  if (toSend > 0)
    parts.push(`${toSend} nota${toSend === 1 ? "" : "'s"} nog te versturen`);
  if (unpaid > 0)
    parts.push(`${unpaid} nota${unpaid === 1 ? "" : "'s"} nog niet betaald`);
  if (parts.length === 0) return null;

  const line = parts.join(", ");
  return urgent > 0 ? `${line} — waarvan ${urgent} met haast` : line;
}

// De eerstkomende gast, groot bovenaan: wie komt er, wanneer, hoe bereik je
// ze, en staat de betaling rond. Blokkades tellen niet mee — die komen niet
// logeren en krijgen geen nota.
export default function NextGuest({
  guests,
  today,
}: {
  guests: BookingRow[];
  today: string;
}) {
  const next = guests[0];

  if (!next) {
    return (
      <div className="mt-3 rounded-card border border-sand bg-snow p-5 text-timber">
        Er staat nog geen bezoek gepland.
      </div>
    );
  }

  const { headline, note } = timing(next);
  // Zonder de nota-kolommen weten we niets over de betaling. Dan liever niets
  // tonen dan "nog geen nota" beweren; de waarschuwing erboven legt uit
  // waarom het ontbreekt.
  const knowsPayment = hasPaymentColumns(next);
  const todo = knowsPayment ? todoLine(guests, today) : null;

  return (
    <div className="mt-3 rounded-card border border-sand bg-snow p-5">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <p className="font-display text-2xl font-semibold text-bark">
          {headline}
        </p>
        {note && <span className="text-sm text-timber">{note}</span>}
      </div>

      <p className="mt-2 text-lg font-semibold text-bark">{next.full_name}</p>
      <p className="text-sm text-timber">
        {fmtLong(next.start_date)} — {fmtLong(next.end_date)}
      </p>
      <p className="mt-1 text-sm text-timber">
        {next.guests} pers. ·{" "}
        <a
          href={`mailto:${next.email}`}
          className="underline-offset-2 hover:underline"
        >
          {next.email}
        </a>
        {next.phone && (
          <>
            {" · "}
            <a
              href={`tel:${next.phone.replace(/\s/g, "")}`}
              className="underline-offset-2 hover:underline"
            >
              {next.phone}
            </a>
          </>
        )}
      </p>

      {knowsPayment && <PaymentStrip booking={next} today={today} />}

      {todo && (
        <p className="mt-3 border-t border-sand pt-3 text-sm text-timber">
          Over alle komende verblijven: {todo}.
        </p>
      )}
    </div>
  );
}
