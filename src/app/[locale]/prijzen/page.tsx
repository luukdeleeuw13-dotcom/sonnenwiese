import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { format } from "date-fns";
import { nl, de, enGB } from "date-fns/locale";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/metadata";
import {
  HIGH_SEASONS,
  WEEK_PRICE_CENTS,
  formatPrice,
} from "@/lib/booking/seasons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pricing" });
  return buildMetadata({
    locale,
    route: "prijzen",
    title: t("title"),
    description: t("intro"),
  });
}

const rowKeys = ["winterHigh", "winterLow", "summerHigh", "summerLow"] as const;

// De hoogseizoensdatums komen uit dezelfde tabel als waarmee de nota wordt
// berekend (lib/booking/seasons.ts). Ze hier nóg een keer intypen zou betekenen
// dat de site en de rekensom volgend jaar stilletjes uit elkaar gaan lopen.
const dateLocales = { nl, de, en: enGB } as const;

function highSeasonDates(
  season: "winterHigh" | "summerHigh",
  locale: string,
): string {
  const dateLocale =
    dateLocales[locale as keyof typeof dateLocales] ?? dateLocales.nl;
  // Duits zet een punt achter het dagnummer: "19. Dezember", niet "19 Dezember".
  const d = locale === "de" ? "d." : "d";
  const day = (iso: string, pattern: string) =>
    format(new Date(`${iso}T00:00:00`), pattern, { locale: dateLocale });

  // Maand en jaar alleen herhalen waar ze verschillen: "13 – 27 februari 2027"
  // leest nu eenmaal prettiger dan datzelfde jaartal twee keer.
  const range = (from: string, to: string) => {
    const sameYear = from.slice(0, 4) === to.slice(0, 4);
    const sameMonth = sameYear && from.slice(5, 7) === to.slice(5, 7);
    if (sameMonth) return `${day(from, d)} – ${day(to, `${d} MMMM yyyy`)}`;
    if (sameYear)
      return `${day(from, `${d} MMMM`)} – ${day(to, `${d} MMMM yyyy`)}`;
    return `${day(from, `${d} MMMM yyyy`)} – ${day(to, `${d} MMMM yyyy`)}`;
  };

  return HIGH_SEASONS.filter((r) => r.season === season)
    .map((r) => range(r.from, r.to))
    .join(" · ");
}
const includedKeys = ["energy", "internet", "parking"] as const;
const extrasKeys = ["linen"] as const;
// "Geen borg" staat bewust vlak achter "meer dan de huur betaal je niet": het
// is dezelfde geruststelling, en dit is de plek waar iemand aan geld denkt.
const paymentKeys = ["when", "deposit", "pets"] as const;

export default function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("pricing");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-bark sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-2xl text-timber">{t("intro")}</p>

      {/* Prijzentabel */}
      <div className="mt-8 overflow-hidden rounded-card border border-sand bg-snow">
        <h2 className="border-b border-sand px-6 py-4 font-display text-2xl font-semibold text-bark">
          {t("tableTitle")}
        </h2>
        <table className="w-full">
          <tbody>
            {rowKeys.map((key, i) => (
              <tr key={key} className={i % 2 === 1 ? "bg-cream/60" : ""}>
                <td className="px-6 py-3.5 text-timber">
                  {t(`rows.${key}.label`)}
                </td>
                {/* Het bedrag komt uit dezelfde tabel als de nota, niet uit de
                    vertalingen. Anders staat een prijswijziging op vier plekken
                    (drie talen plus de rekensom) en vergeet je er één. */}
                <td className="whitespace-nowrap px-6 py-3.5 text-right font-semibold text-bark">
                  {formatPrice(WEEK_PRICE_CENTS[key], locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Welke week in welk seizoen valt. Zonder dit blok is de tabel hierboven
          een prijslijst zonder kalender, en moet iedereen alsnog mailen. */}
      <div className="mt-6 rounded-card border border-sand bg-snow p-6">
        <h2 className="font-display text-xl font-semibold text-bark">
          {t("seasons.title")}
        </h2>
        <dl className="mt-3 space-y-2.5">
          {(
            [
              ["winterHigh", highSeasonDates("winterHigh", locale)],
              ["summerHigh", highSeasonDates("summerHigh", locale)],
              ["winterLow", t("seasons.winterLowValue")],
              ["summerLow", t("seasons.summerLowValue")],
            ] as const
          ).map(([key, value]) => (
            <div key={key} className="sm:flex sm:gap-3">
              <dt className="font-semibold text-bark sm:w-52 sm:shrink-0">
                {t(`seasons.${key}`)}
              </dt>
              <dd className="text-timber">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-timber">{t("seasons.note")}</p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-card bg-sand/60 p-6">
          <h2 className="font-display text-xl font-semibold text-bark">
            {t("includedTitle")}
          </h2>
          <ul className="mt-3 space-y-2">
            {includedKeys.map((key) => (
              <li key={key} className="flex items-start gap-2 text-timber">
                <svg
                  className="mt-1 shrink-0 text-meadow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="4 12 10 18 20 6" />
                </svg>
                {t(`included.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-card bg-sand/60 p-6">
          <h2 className="font-display text-xl font-semibold text-bark">
            {t("extrasTitle")}
          </h2>
          <ul className="mt-3 space-y-2">
            {extrasKeys.map((key) => (
              <li key={key} className="flex items-start gap-2 text-timber">
                <svg
                  className="mt-1 shrink-0 text-sun-dark"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t(`extras.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-card border border-sand bg-snow p-6">
        <h2 className="font-display text-xl font-semibold text-bark">
          {t("paymentTitle")}
        </h2>
        <ul className="mt-3 space-y-2 text-timber">
          {paymentKeys.map((key) => (
            <li key={key} className="leading-relaxed">
              {t(`payment.${key}`)}
            </li>
          ))}
        </ul>
        <Link
          href="/beschikbaarheid"
          className="mt-5 inline-block rounded-lg bg-sun px-5 py-3 text-sm font-semibold text-snow transition-colors hover:bg-sun-dark"
        >
          {t("cta")}
        </Link>
      </div>
    </div>
  );
}
