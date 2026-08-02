import { addDays, format } from "date-fns";
import { nl } from "date-fns/locale";
import { startOfRentalWeek } from "@/lib/booking/weeks";
import { isOwnerBlock } from "@/lib/admin/bookings";
import type { BookingRow } from "@/lib/supabase/types";

// Hoeveel verhuurweken vooruit we tonen. Een jaar: verder dan dat wordt er
// zelden geboekt, en langer maakt de strook onleesbaar.
const WEEKS_AHEAD = 53;

type WeekState = "free" | "guest" | "block" | "pending";

type Week = {
  start: string; // yyyy-MM-dd, de aankomstzaterdag
  end: string; // yyyy-MM-dd, de vertrekzaterdag
  day: number; // dagnummer van de aankomstzaterdag
  monthKey: string;
  monthLabel: string;
  state: WeekState;
  entries: { label: string; detail: string }[];
};

const styles: Record<WeekState, string> = {
  free: "border-sand bg-cream text-timber",
  guest: "border-meadow-dark bg-meadow text-snow",
  block: "border-bark bg-bark text-cream",
  pending: "border-sun-dark bg-sun text-snow",
};

const legend: { state: WeekState; label: string }[] = [
  { state: "free", label: "Vrij" },
  { state: "guest", label: "Gast" },
  { state: "pending", label: "Aanvraag" },
  { state: "block", label: "Blokkade" },
];

function fmtShort(date: string): string {
  return format(new Date(`${date}T00:00:00`), "d MMM", { locale: nl });
}

// Overlap tussen twee periodes, met de vertrekdag als open einde: wie op
// zaterdag vertrekt bezet die zaterdag niet meer, want dan komt de volgende
// gast. Dezelfde regel als in de kalender op de site.
function overlaps(aFrom: string, aTo: string, bFrom: string, bTo: string) {
  return aFrom < bTo && aTo > bFrom;
}

function buildWeeks(bookings: BookingRow[]): Week[] {
  const first = startOfRentalWeek(new Date());
  const weeks: Week[] = [];

  for (let i = 0; i < WEEKS_AHEAD; i++) {
    const from = addDays(first, i * 7);
    const to = addDays(from, 7);
    const start = format(from, "yyyy-MM-dd");
    const end = format(to, "yyyy-MM-dd");

    const hits = bookings.filter(
      (b) =>
        b.status !== "rejected" &&
        overlaps(start, end, b.start_date, b.end_date)
    );

    // Een bevestigde boeking weegt zwaarder dan een aanvraag: als er al
    // iemand ligt, is de kleur van de week die van de gast, ook al staat er
    // nog een hoopvolle aanvraag voor dezelfde week open.
    const confirmed = hits.find((b) => b.status === "confirmed");
    let state: WeekState = "free";
    if (confirmed) state = isOwnerBlock(confirmed) ? "block" : "guest";
    else if (hits.length > 0) state = "pending";

    weeks.push({
      start,
      end,
      day: from.getDate(),
      monthKey: format(from, "yyyy-MM"),
      monthLabel: format(from, "MMMM yyyy", { locale: nl }),
      state,
      entries: hits.map((b) => ({
        label: isOwnerBlock(b) ? `${b.full_name} (blokkade)` : b.full_name,
        detail:
          `${fmtShort(b.start_date)} – ${fmtShort(b.end_date)}` +
          (isOwnerBlock(b) ? "" : ` · ${b.guests} pers.`) +
          (b.status === "pending" ? " · aanvraag" : ""),
      })),
    });
  }

  return weeks;
}

// Strook verhuurweken, per maand. Elk blokje is één week zaterdag–zaterdag;
// eronder staat de aankomstdatum. Wie er met de muis op gaat staan (of er op
// de telefoon op tikt) ziet wie er ligt.
export default function WeekPlanner({ bookings }: { bookings: BookingRow[] }) {
  const weeks = buildWeeks(bookings);

  const months: { key: string; label: string; weeks: Week[] }[] = [];
  for (const week of weeks) {
    const last = months[months.length - 1];
    if (last?.key === week.monthKey) last.weeks.push(week);
    else
      months.push({ key: week.monthKey, label: week.monthLabel, weeks: [week] });
  }

  return (
    <div className="mt-3 rounded-card border border-sand bg-snow p-4">
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-sand pb-3 text-sm text-timber">
        {legend.map((item) => (
          <span key={item.state} className="flex items-center gap-2">
            <span
              className={`inline-block h-3.5 w-3.5 rounded border ${styles[item.state]}`}
            />
            {item.label}
          </span>
        ))}
      </div>

      <div className="mt-3 space-y-3">
        {months.map((month) => (
          <div key={month.key} className="flex flex-wrap items-center gap-2">
            {/* Op een telefoon past de maandnaam niet naast vijf blokjes;
                dan krijgt hij zijn eigen regel in plaats van een rafelige
                rand. */}
            <span className="w-full shrink-0 text-sm text-timber sm:w-32">
              {month.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {month.weeks.map((week) => (
                <span key={week.start} className="group relative">
                  {/* tabIndex maakt het blokje aanraakbaar: op een telefoon
                      is er geen muis om mee te zweven, maar een tik geeft
                      focus en dus dezelfde toelichting. */}
                  <span
                    tabIndex={0}
                    className={`flex h-9 w-9 cursor-default items-center justify-center rounded-lg border text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-meadow-dark ${styles[week.state]}`}
                  >
                    {week.day}
                  </span>
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-[15rem] -translate-x-1/2 rounded-lg bg-bark px-3 py-2 text-left text-xs leading-snug text-cream shadow-lg group-hover:block group-focus-within:block">
                    <span className="block font-semibold">
                      {fmtShort(week.start)} – {fmtShort(week.end)}
                    </span>
                    {week.entries.length === 0 ? (
                      <span className="block text-sand">Vrij</span>
                    ) : (
                      week.entries.map((entry) => (
                        <span key={entry.label + entry.detail} className="mt-1 block">
                          {entry.label}
                          <span className="block text-sand">{entry.detail}</span>
                        </span>
                      ))
                    )}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
