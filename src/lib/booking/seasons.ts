export type SeasonKey = "winterHigh" | "winterLow" | "summerHigh" | "summerLow";

// De huurprijs hangt aan de week, niet aan de nacht: er wordt alleen van
// zaterdag tot zaterdag verhuurd (zie weeks.ts). Een week valt in precies één
// seizoen, en de vier seizoenen samen dekken het hele jaar — er is dus nooit
// een week zonder prijs binnen de looptijd van de tabel.

export type HighSeason = {
  season: "winterHigh" | "summerHigh";
  from: string; // yyyy-MM-dd, de zaterdag waarop de eerste week begint
  to: string; // yyyy-MM-dd, de zaterdag waarop de laatste week eindigt
};

// Alles wat de eigenaar per jaar bijstelt, bij elkaar: de vier weekprijzen,
// de hoogseizoenen en de looptijd. Het beheerscherm bewaart precies dit
// object in de database (zie seasonTable.ts); dit bestand rekent er alleen
// mee en weet niet waar het vandaan komt. Daardoor kan dezelfde rekensom ook
// in de browser draaien, onder de kalender.
export type SeasonTable = {
  // Weekprijs in centen per seizoen.
  prices: Record<SeasonKey, number>;
  // De hoogseizoenen liggen vast op datum, want ze volgen de schoolvakanties
  // en die schuiven elk jaar op. Een week telt als hoogseizoen zodra hij
  // hélemaal binnen zo'n periode valt.
  highSeasons: HighSeason[];
  // Tot hoever de tabel te vertrouwen is. Buiten dit venster geeft de
  // berekening géén bedrag terug in plaats van een gokje: een week in
  // december 2027 zou anders als laagseizoen geprijsd worden terwijl er dan
  // gewoon weer kerstvakantie is. Een leeg voorstel valt op, een te laag
  // bedrag niet.
  validFrom: string;
  validUntil: string;
};

// De tabel zoals hij gold toen het beheerscherm hem nog niet kon aanpassen.
// Geldt zolang er in de database niets is opgeslagen — en dus ook als de
// migratie met de instellingentabel nog niet gedraaid heeft.
export const DEFAULT_SEASON_TABLE: SeasonTable = {
  prices: {
    winterHigh: 185_000,
    winterLow: 80_000,
    summerHigh: 80_000,
    summerLow: 45_000,
  },
  highSeasons: [
    // Kerst- en nieuwjaarsvakantie
    { season: "winterHigh", from: "2026-12-19", to: "2027-01-02" },
    // Semesterferien
    { season: "winterHigh", from: "2027-02-06", to: "2027-02-27" },
    // Zomervakantie
    { season: "summerHigh", from: "2027-07-10", to: "2027-09-04" },
  ],
  validFrom: "2026-09-05",
  validUntil: "2027-11-27",
};

export const SEASON_KEYS: SeasonKey[] = [
  "winterHigh",
  "winterLow",
  "summerHigh",
  "summerLow",
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Wat uit de database komt is JSON, en JSON belooft niets. Liever hier één
// keer streng nakijken en bij twijfel `null` teruggeven dan dat een half
// opgeslagen tabel een nota van € NaN oplevert.
export function parseSeasonTable(raw: unknown): SeasonTable | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;

  const rawPrices = (value.prices ?? {}) as Record<string, unknown>;
  const prices = {} as Record<SeasonKey, number>;
  for (const key of SEASON_KEYS) {
    const cents = rawPrices[key];
    if (typeof cents !== "number" || !Number.isInteger(cents) || cents <= 0) {
      return null;
    }
    prices[key] = cents;
  }

  if (!Array.isArray(value.highSeasons)) return null;
  const highSeasons: HighSeason[] = [];
  for (const entry of value.highSeasons as Record<string, unknown>[]) {
    if (!entry || typeof entry !== "object") return null;
    if (entry.season !== "winterHigh" && entry.season !== "summerHigh") {
      return null;
    }
    if (!isIsoDate(entry.from) || !isIsoDate(entry.to)) return null;
    if (entry.to <= entry.from) return null;
    highSeasons.push({ season: entry.season, from: entry.from, to: entry.to });
  }

  if (!isIsoDate(value.validFrom) || !isIsoDate(value.validUntil)) return null;
  if (value.validUntil <= value.validFrom) return null;

  return {
    prices,
    // Op datum, zodat de prijzenpagina ze in de volgorde van het jaar toont,
    // ongeacht in welke volgorde ze zijn ingevoerd.
    highSeasons: highSeasons.sort((a, b) => a.from.localeCompare(b.from)),
    validFrom: value.validFrom,
    validUntil: value.validUntil,
  };
}

// Bedragen naar het scherm, in de opmaak van de bezoeker: "€ 1.850" voor een
// Nederlander, "1.850 €" voor een Duitser. De centen blijven weg zolang ze nul
// zijn — alle weekprijzen zijn hele euro's, en "€ 1.850,00" leest als een nota
// in plaats van als een prijs.
export function formatPrice(cents: number, locale: string): string {
  return (cents / 100).toLocaleString(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

export const SEASON_LABELS: Record<SeasonKey, string> = {
  winterHigh: "winter — hoogseizoen",
  winterLow: "winter — laagseizoen",
  summerHigh: "zomer — hoogseizoen",
  summerLow: "zomer — laagseizoen",
};

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
export function seasonForWeek(
  weekStart: string,
  table: SeasonTable,
): SeasonKey | null {
  if (weekStart < table.validFrom || weekStart > table.validUntil) {
    return null;
  }
  const weekEnd = addDaysIso(weekStart, 7);
  for (const range of table.highSeasons) {
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
  table: SeasonTable,
): PriceEstimate {
  const span = daysBetween(startDate, endDate);
  if (span <= 0 || span % 7 !== 0) return { ok: false, reason: "not-whole-weeks" };

  const weeks: WeekPrice[] = [];
  for (let offset = 0; offset < span; offset += 7) {
    const start = addDaysIso(startDate, offset);
    const season = seasonForWeek(start, table);
    // Aan welke kant de week buiten de tabel valt, bepaalt wat je eraan kunt
    // doen: vóór het venster is de prijs van een verstreken seizoen en die
    // komt er niet meer bij, ná het venster moet de tabel bijgewerkt worden.
    // Eén gedeelde reden liet het beheerscherm naar het verkeerde eind wijzen.
    if (!season) {
      return {
        ok: false,
        reason: start < table.validFrom ? "before-table" : "after-table",
      };
    }
    weeks.push({
      start,
      end: addDaysIso(start, 7),
      season,
      cents: table.prices[season],
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
