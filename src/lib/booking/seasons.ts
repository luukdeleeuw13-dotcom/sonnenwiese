export type SeasonKey = "winterHigh" | "winterLow" | "summerHigh" | "summerLow";

// De huurprijs hangt aan de week, niet aan de nacht: er wordt alleen van
// zaterdag tot zaterdag verhuurd (zie weeks.ts). Een week valt in precies één
// seizoen, en de vier seizoenen samen dekken het hele jaar — er is dus nooit
// een week zonder prijs binnen de looptijd van de tabel hieronder.

export const WEEK_PRICE_CENTS: Record<SeasonKey, number> = {
  winterHigh: 185_000,
  winterLow: 80_000,
  summerHigh: 70_000,
  summerLow: 45_000,
};

export const SEASON_LABELS: Record<SeasonKey, string> = {
  winterHigh: "winter — hoogseizoen",
  winterLow: "winter — laagseizoen",
  summerHigh: "zomer — hoogseizoen",
  summerLow: "zomer — laagseizoen",
};

// ---------------------------------------------------------------------------
// BIJWERKEN PER JAAR — dit is het enige stukje dat verandert.
//
// De hoogseizoenen liggen vast op datum, want ze volgen de Oostenrijkse
// schoolvakanties en die schuiven elk jaar op. `from` is de zaterdag waarop de
// eerste hoogseizoensweek begint, `to` de zaterdag waarop de laatste eindigt.
// Een week telt als hoogseizoen zodra hij hélemaal binnen zo'n periode valt.
// ---------------------------------------------------------------------------
export const HIGH_SEASONS: {
  season: "winterHigh" | "summerHigh";
  from: string;
  to: string;
}[] = [
  // Kerst- en nieuwjaarsvakantie
  { season: "winterHigh", from: "2026-12-19", to: "2027-01-02" },
  // Semesterferien
  { season: "winterHigh", from: "2027-02-13", to: "2027-02-27" },
  // Zomervakantie
  { season: "summerHigh", from: "2027-07-10", to: "2027-09-04" },
];

// Tot hoever de tabel hierboven te vertrouwen is. Buiten dit venster geeft de
// berekening géén bedrag terug in plaats van een gokje: een week in december
// 2027 zou anders als laagseizoen geprijsd worden terwijl er dan gewoon weer
// kerstvakantie is. Een leeg voorstel valt op, een te laag bedrag niet.
export const SEASONS_VALID_FROM = "2026-09-05";
export const SEASONS_VALID_UNTIL = "2027-11-27";

// Winter is waar geskied kan worden: een week hoort bij de winter als hij in
// december, januari, februari of maart begínt. De week van 27 maart tot 3
// april is dus nog winter; de eerste week die ín april begint niet meer.
const WINTER_MONTHS = new Set([12, 1, 2, 3]);

function addDaysIso(iso: string, days: number): string {
  // Bewust in UTC: een datum zonder tijd mag niet van de tijdzone van de
  // server afhangen — dezelfde zaterdag is in Los Angeles anders een vrijdag.
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const ms =
    new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
  return Math.round(ms / 86_400_000);
}

// In welk seizoen valt de week die op `weekStart` begint? `null` betekent:
// buiten de looptijd van de tabel, hier kan ik niets zinnigs over zeggen.
export function seasonForWeek(weekStart: string): SeasonKey | null {
  if (weekStart < SEASONS_VALID_FROM || weekStart > SEASONS_VALID_UNTIL) {
    return null;
  }
  const weekEnd = addDaysIso(weekStart, 7);
  for (const range of HIGH_SEASONS) {
    if (weekStart >= range.from && weekEnd <= range.to) return range.season;
  }
  const month = Number(weekStart.slice(5, 7));
  return WINTER_MONTHS.has(month) ? "winterLow" : "summerLow";
}

export type WeekPrice = {
  start: string;
  end: string;
  season: SeasonKey;
  cents: number;
};

export type PriceEstimate =
  | { ok: true; weeks: WeekPrice[]; totalCents: number }
  | { ok: false; reason: "not-whole-weeks" | "before-table" | "after-table" };

// Het voorstel voor een heel verblijf: elke week apart geprijsd en opgeteld.
// Per week en niet per verblijf, omdat een verblijf over een seizoensgrens
// heen kan lopen — twee weken kerst plus één week januari is niet drie keer
// hetzelfde bedrag.
export function estimatePrice(
  startDate: string,
  endDate: string,
): PriceEstimate {
  const span = daysBetween(startDate, endDate);
  if (span <= 0 || span % 7 !== 0) return { ok: false, reason: "not-whole-weeks" };

  const weeks: WeekPrice[] = [];
  for (let offset = 0; offset < span; offset += 7) {
    const start = addDaysIso(startDate, offset);
    const season = seasonForWeek(start);
    // Aan welke kant de week buiten de tabel valt, bepaalt wat je eraan kunt
    // doen: vóór het venster is de prijs van een verstreken seizoen en die
    // komt er niet meer bij, ná het venster moet de tabel bijgewerkt worden.
    // Eén gedeelde reden liet het beheerscherm naar het verkeerde eind wijzen.
    if (!season) {
      return {
        ok: false,
        reason: start < SEASONS_VALID_FROM ? "before-table" : "after-table",
      };
    }
    weeks.push({
      start,
      end: addDaysIso(start, 7),
      season,
      cents: WEEK_PRICE_CENTS[season],
    });
  }

  return {
    ok: true,
    weeks,
    totalCents: weeks.reduce((sum, week) => sum + week.cents, 0),
  };
}

// "1 week winter — hoogseizoen" of "2 × winter — hoogseizoen, 1 × winter —
// laagseizoen": genoeg om te zien waar een bedrag vandaan komt zonder de
// tabel erbij te pakken.
export function describeWeeks(weeks: WeekPrice[]): string {
  const counts = new Map<SeasonKey, number>();
  for (const week of weeks) {
    counts.set(week.season, (counts.get(week.season) ?? 0) + 1);
  }
  if (counts.size === 1 && weeks.length === 1) {
    return `1 week ${SEASON_LABELS[weeks[0].season]}`;
  }
  return [...counts]
    .map(([season, count]) => `${count} × ${SEASON_LABELS[season]}`)
    .join(", ");
}
