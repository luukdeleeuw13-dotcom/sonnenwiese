import { format } from "date-fns";
import { nl, de, enGB } from "date-fns/locale";

// De drie talen waarin er mail de deur uit gaat. Komt er uit de database een
// taal die we niet kennen, dan schrijven we Nederlands — dat is de taal van
// de eigenaar, en die kan er dan altijd nog iets mee.
const dateLocales = { nl, de, en: enGB } as const;

export type EmailLocale = keyof typeof dateLocales;

export function emailLocale(value: string): EmailLocale {
  return (value in dateLocales ? value : "nl") as EmailLocale;
}

// Datum voluit, zoals hij in een mail hoort te staan.
// Duits zet een punt achter het dagnummer: "19. Dezember 2026", niet
// "19 Dezember 2026". Dezelfde regel als op de prijzenpagina — hij staat hier
// zodat de mails en de site het niet elk op hun eigen manier doen.
export function formatLongDate(iso: string, locale: EmailLocale): string {
  return format(
    new Date(`${iso}T00:00:00`),
    locale === "de" ? "d. MMMM yyyy" : "d MMMM yyyy",
    { locale: dateLocales[locale] }
  );
}
