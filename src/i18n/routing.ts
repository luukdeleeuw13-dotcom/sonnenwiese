import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["nl", "de", "en"],
  defaultLocale: "nl",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const localeLabels: Record<Locale, string> = {
  nl: "Nederlands",
  de: "Deutsch",
  en: "English",
};
