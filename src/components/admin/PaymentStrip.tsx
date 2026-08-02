import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  formatEuro,
  invoiceDueDate,
  needsAttention,
  paymentState,
} from "@/lib/admin/payments";
import {
  applySuggestedPrice,
  togglePaymentMoment,
  setInvoiceRequired,
  setPrice,
} from "@/app/admin/actions";
import {
  describeWeeks,
  estimatePrice,
  SEASONS_VALID_UNTIL,
} from "@/lib/booking/seasons";
import type { BookingRow } from "@/lib/supabase/types";

function fmtDay(value: string): string {
  return format(new Date(value), "d MMM", { locale: nl });
}

// Mét jaartal: bij de looptijd van de seizoenstabel is "27 nov" zonder jaar
// precies de vraag die je wilde beantwoorden.
function fmtDayYear(value: string): string {
  return format(new Date(value), "d MMMM yyyy", { locale: nl });
}

const badgeStyles = "rounded-full px-3 py-1 text-xs font-semibold";
const buttonStyles =
  "rounded-lg border border-sand bg-snow px-3 py-1.5 text-sm font-semibold text-timber hover:border-timber";
const primaryStyles =
  "rounded-lg bg-meadow px-3 py-1.5 text-sm font-semibold text-snow hover:bg-meadow-dark";

// Nota- en betaalstatus van één verblijf: waar staat het, en wat is de
// volgende stap. Bewust knoppen en geen keuzelijst — één klik per stap, ook
// vanaf de telefoon.
export default function PaymentStrip({
  booking,
  today,
}: {
  booking: BookingRow;
  today: string;
}) {
  const state = paymentState(booking);
  const attention = needsAttention(booking, today);

  // Voorstel uit de seizoenstabel. Het blijft een vóórstel: er staat een knop
  // om het over te nemen, niet een bedrag dat zichzelf invult. Een afspraak
  // met een gast kan van de tabel afwijken, en dan hoort de tabel te wijken.
  const estimate = estimatePrice(booking.start_date, booking.end_date);
  const suggestion = estimate.ok ? estimate.totalCents : null;
  const matchesTable = suggestion !== null && booking.price_cents === suggestion;

  return (
    <div
      className={`mt-3 rounded-lg border p-3 ${
        attention ? "border-red-200 bg-red-50" : "border-sand bg-cream"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {state === "notRequired" && (
          <span className={`${badgeStyles} bg-sand text-timber`}>
            Familie — geen nota
          </span>
        )}
        {state === "todo" && (
          <span
            className={`${badgeStyles} ${
              attention ? "bg-red-600 text-snow" : "bg-sun/20 text-sun-dark"
            }`}
          >
            Nota nog niet verstuurd
          </span>
        )}
        {state === "sent" && (
          <span
            className={`${badgeStyles} ${
              attention ? "bg-red-600 text-snow" : "bg-sun text-snow"
            }`}
          >
            Nota verstuurd · nog niet betaald
          </span>
        )}
        {state === "paid" && (
          <span className={`${badgeStyles} bg-meadow text-snow`}>
            Betaald
          </span>
        )}

        <span className="text-sm text-timber">
          {state === "todo" && (
            <>Versturen vóór {fmtDay(`${invoiceDueDate(booking)}T00:00:00`)}</>
          )}
          {state === "sent" && booking.invoice_sent_at && (
            <>Verstuurd op {fmtDay(booking.invoice_sent_at)}</>
          )}
          {state === "paid" && booking.paid_at && (
            <>Binnen op {fmtDay(booking.paid_at)}</>
          )}
        </span>

        {typeof booking.price_cents === "number" && (
          <span className="ml-auto font-semibold text-bark">
            {formatEuro(booking.price_cents)}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {state === "todo" && (
          <form action={togglePaymentMoment}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="field" value="invoice_sent_at" />
            <input type="hidden" name="value" value="on" />
            <button className={primaryStyles}>✓ Nota verstuurd</button>
          </form>
        )}
        {state === "sent" && (
          <>
            <form action={togglePaymentMoment}>
              <input type="hidden" name="id" value={booking.id} />
              <input type="hidden" name="field" value="paid_at" />
              <input type="hidden" name="value" value="on" />
              <button className={primaryStyles}>✓ Betaald</button>
            </form>
            <form action={togglePaymentMoment}>
              <input type="hidden" name="id" value={booking.id} />
              <input type="hidden" name="field" value="invoice_sent_at" />
              <input type="hidden" name="value" value="off" />
              <button className={buttonStyles}>↺ Toch niet verstuurd</button>
            </form>
          </>
        )}
        {state === "paid" && (
          <form action={togglePaymentMoment}>
            <input type="hidden" name="id" value={booking.id} />
            <input type="hidden" name="field" value="paid_at" />
            <input type="hidden" name="value" value="off" />
            <button className={buttonStyles}>↺ Toch niet betaald</button>
          </form>
        )}

        {/* Familie aan- of afzetten. Staat bij "nog niet verstuurd" naast de
            hoofdknop, en anders alleen om terug te draaien. */}
        {(state === "todo" || state === "notRequired") && (
          <form action={setInvoiceRequired}>
            <input type="hidden" name="id" value={booking.id} />
            <input
              type="hidden"
              name="value"
              value={state === "notRequired" ? "true" : "false"}
            />
            <button className={buttonStyles}>
              {state === "notRequired" ? "↺ Toch een nota" : "Geen nota nodig"}
            </button>
          </form>
        )}

        {state !== "notRequired" && (
          <form action={setPrice} className="ml-auto flex items-center gap-2">
            <input type="hidden" name="id" value={booking.id} />
            <label className="flex items-center gap-1.5 text-sm text-timber">
              Bedrag
              <input
                type="text"
                name="price"
                inputMode="decimal"
                defaultValue={
                  typeof booking.price_cents === "number"
                    ? (booking.price_cents / 100).toFixed(2).replace(".", ",")
                    : ""
                }
                placeholder="€"
                className="w-24 rounded-lg border border-sand bg-snow px-2 py-1.5 text-bark"
              />
            </label>
            <button className={buttonStyles}>Opslaan</button>
          </form>
        )}
      </div>

      {state !== "notRequired" && (
        <div className="mt-2 border-t border-sand pt-2 text-sm text-timber">
          {estimate.ok && matchesTable && (
            <span>
              Volgens de seizoenstabel: {describeWeeks(estimate.weeks)}.
            </span>
          )}

          {estimate.ok && !matchesTable && (
            <form
              action={applySuggestedPrice}
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="id" value={booking.id} />
              <span>
                Tabel zegt{" "}
                <strong className="text-bark">
                  {formatEuro(estimate.totalCents)}
                </strong>{" "}
                — {describeWeeks(estimate.weeks)}.
              </span>
              <button className={buttonStyles}>Overnemen</button>
            </form>
          )}

          {/* Buiten de looptijd van de tabel rekent de site bewust niets uit.
              Beter een lege plek die om aandacht vraagt dan een bedrag uit een
              verlopen schoolvakantiekalender. */}
          {!estimate.ok && estimate.reason === "outside-table" && (
            <span>
              De seizoenstabel loopt tot{" "}
              {fmtDayYear(`${SEASONS_VALID_UNTIL}T00:00:00`)} — vul het bedrag
              met de hand in, of werk de tabel bij.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
