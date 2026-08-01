import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITE_ROUTES, pathFor } from "@/lib/routes";
import { SITE_URL } from "@/lib/config";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routing.locales.flatMap((locale) =>
    SITE_ROUTES.map((route) => ({
      url: `${SITE_URL}${pathFor(locale, route)}`,
      lastModified,
      changeFrequency: "monthly" as const,
      // Home en de boekingspagina zijn waar we bezoekers willen hebben.
      priority: route === "" ? 1 : route === "beschikbaarheid" ? 0.9 : 0.7,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, `${SITE_URL}${pathFor(l, route)}`])
        ),
      },
    }))
  );
}
