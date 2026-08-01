import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { pathFor } from "@/lib/routes";

// Canonical + hreflang voor één pagina.
//
// Dezelfde inhoud staat op /nl, /de en /en. Zonder deze tags ziet Google
// dat als drie keer hetzelfde en kiest hij er zelf één uit — vaak niet de
// taal van de bezoeker. De canonical wijst naar de eigen taalversie; de
// languages-lijst vertelt welke vertalingen daarnaast bestaan.
export function alternatesFor(
  locale: string,
  route: string
): Metadata["alternates"] {
  return {
    canonical: pathFor(locale, route),
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [l, pathFor(l, route)])
      ),
      "x-default": pathFor(routing.defaultLocale, route),
    },
  };
}

// Standaard-metadata voor een contentpagina. De titel wordt door het
// template in de locale-layout aangevuld met de sitenaam.
export function buildMetadata({
  locale,
  route,
  title,
  description,
}: {
  locale: string;
  route: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title,
    description,
    alternates: alternatesFor(locale, route),
    openGraph: {
      title,
      description,
      url: pathFor(locale, route),
    },
  };
}
