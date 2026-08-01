// De canonieke lijst van publieke pagina's, zonder locale-prefix.
// Eén bron voor de sitemap en de hreflang-tags: een pagina toevoegen
// betekent hem hier toevoegen, niet op drie plekken.
export const SITE_ROUTES = [
  "",
  "appartement",
  "fotos",
  "omgeving",
  "prijzen",
  "beschikbaarheid",
  "route-praktisch",
] as const;

export type SiteRoute = (typeof SITE_ROUTES)[number];

export function pathFor(locale: string, route: string): string {
  return route ? `/${locale}/${route}` : `/${locale}`;
}
