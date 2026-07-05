import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import Hero from "@/components/ui/Hero";
import HighlightCard from "@/components/ui/HighlightCard";

const icons = {
  guests: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="8" r="2.5" />
      <path d="M21 19c0-2.5-1.8-4.5-4-4.9" />
    </svg>
  ),
  ski: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20 9 8l3.5 6L15 10l6 10Z" />
      <path d="M9 8V5" />
    </svg>
  ),
  village: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V10l5-4 5 4v11" />
      <path d="M13 21v-6h5v6" />
      <path d="M9 21v-4" />
      <path d="M13 10h7" />
    </svg>
  ),
};

export default function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("home");

  return (
    <>
      <Hero
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        alt="Sonnenwiese, Maria Alm"
        cta={
          <Link
            href="/beschikbaarheid"
            className="inline-block rounded-lg bg-sun px-6 py-3.5 text-base font-semibold text-snow shadow-lg transition-colors hover:bg-sun-dark"
          >
            {t("heroCta")}
          </Link>
        }
      />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h2 className="sr-only">{t("highlightsTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <HighlightCard
            icon={icons.guests}
            title={t("highlightGuests")}
            text={t("highlightGuestsText")}
          />
          <HighlightCard
            icon={icons.ski}
            title={t("highlightSki")}
            text={t("highlightSkiText")}
            href="https://www.hochkoenig.at/en/winter/ski-area/ski-fun-in-the-hochkoenig-ski-region.html"
          />
          <HighlightCard
            icon={icons.village}
            title={t("highlightVillage")}
            text={t("highlightVillageText")}
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-card bg-sand/60 p-6 sm:p-10">
          <h2 className="font-display text-2xl font-semibold text-bark sm:text-3xl">
            {t("introTitle")}
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-timber">
            {t("introText")}
          </p>
          <Link
            href="/appartement"
            className="mt-5 inline-block font-semibold text-meadow-dark underline-offset-4 hover:underline"
          >
            {t("introCta")} →
          </Link>
        </div>
      </section>
    </>
  );
}
