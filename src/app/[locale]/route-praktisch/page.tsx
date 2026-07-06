import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import Section from "@/components/ui/Section";

export default function PracticalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("practical");
  const tc = useTranslations("common");

  return (
    <div className="pb-4 pt-10">
      <div className="mx-auto max-w-5xl px-4">
        <h1 className="font-display text-3xl font-semibold text-bark sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-timber">{t("intro")}</p>
      </div>

      <Section title={t("routeTitle")}>
        <p>{t("routeText")}</p>
      </Section>

      {/* Interactieve kaart (OpenStreetMap: geen cookies, dus geen
          cookiebanner nodig) — in- en uitzoombaar tot wereldniveau.
          Google Maps alleen als uitgaande link, die zet pas cookies na klik. */}
      <section className="mx-auto max-w-5xl px-4 py-8">
        <h2 className="font-display text-2xl font-semibold text-bark sm:text-3xl">
          {t("mapTitle")}
        </h2>
        <div className="mt-4 overflow-hidden rounded-card border border-sand">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=12.8538%2C47.3900%2C12.9338%2C47.4300&layer=mapnik&marker=47.40999%2C12.89382"
            title={t("mapTitle")}
            className="h-[320px] w-full sm:h-[420px]"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
          />
        </div>
        <a
          href="https://www.google.com/maps/search/?api=1&query=Klinglerau%205%2C%205760%20Saalfelden%20am%20Steinernen%20Meer%2C%20%C3%96sterreich"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-meadow-dark underline-offset-4 hover:underline"
        >
          {t("mapOpenGoogle")} →
        </a>
      </section>

      <Section title={t("arrivalTitle")}>
        <p>{t("arrivalText")}</p>
      </Section>

      {/* Huisregels zijn nog niet aangeleverd — bewuste placeholder. */}
      <Section title={t("rulesTitle")}>
        <p>{t("rulesText")}</p>
      </Section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-card bg-sand/60 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-bark">
            {t("questionsTitle")}
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-timber">
            {t("questionsText")}
          </p>
          <Link
            href="/beschikbaarheid"
            className="mt-5 inline-block rounded-lg bg-sun px-5 py-3 text-sm font-semibold text-snow transition-colors hover:bg-sun-dark"
          >
            {tc("contactCta")}
          </Link>
        </div>
      </section>
    </div>
  );
}
