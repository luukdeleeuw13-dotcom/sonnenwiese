// Welke helft van het jaar de voorpagina laat zien. Het huis wordt zomer én
// winter verhuurd, maar wie in december kijkt wil sneeuw zien en geen
// bloemenweide — en omgekeerd.
export type SiteSeason = "winter" | "summer";

// Winter loopt van 1 november tot 1 maart: november, december, januari en
// februari. De rest van het jaar is zomer.
const WINTER_MONTHS = new Set([11, 12, 1, 2]);

export function currentSiteSeason(now: Date = new Date()): SiteSeason {
  // Met SITE_SEASON=winter of =summer in de omgeving kijk je naar de andere
  // helft zonder op de kalender te wachten. Bedoeld voor lokaal nakijken; op
  // de echte site hoort hij leeg te zijn.
  const forced = process.env.SITE_SEASON;
  if (forced === "winter" || forced === "summer") return forced;

  // De maand in Oostenrijk, niet die van de server: Vercel draait op UTC, en
  // daar is het op 1 november om half één 's nachts nog oktober.
  const month = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Vienna",
      month: "numeric",
    }).format(now),
  );
  return WINTER_MONTHS.has(month) ? "winter" : "summer";
}
