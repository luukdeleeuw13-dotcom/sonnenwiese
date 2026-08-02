import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";
import { alternatesFor } from "@/lib/metadata";
import { pathFor } from "@/lib/routes";
import Hero from "@/components/ui/Hero";
import HighlightCard from "@/components/ui/HighlightCard";
import PhotoMosaic from "@/components/ui/PhotoMosaic";
import SeasonSection from "@/components/ui/SeasonSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  // De homepage draagt de sitenaam zelf al; geen template-suffix erbij.
  return {
    title: { absolute: t("siteTitle") },
    description: t("siteDescription"),
    alternates: alternatesFor(locale, ""),
    openGraph: {
      title: t("siteTitle"),
      description: t("siteDescription"),
      url: pathFor(locale, ""),
    },
  };
}

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
        src="/photos/omgeving-hochkonig-zomer.jpg"
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

      {/* Smal en stil vlak na de hero: eerst wie we zijn, dan pas wat je krijgt.
          Zonder kader, zodat het leest als iemand die iets vertelt. */}
      <section className="mx-auto max-w-2xl px-4 pb-4 pt-12 text-center sm:pt-16">
        <h2 className="font-display text-2xl font-semibold text-bark sm:text-3xl">
          {t("introTitle")}
        </h2>
        <p className="mt-4 leading-relaxed text-timber">{t("introText")}</p>
        <Link
          href="/appartement"
          className="mt-5 inline-block font-semibold text-meadow-dark underline-offset-4 hover:underline"
        >
          {t("introCta")} →
        </Link>
      </section>

      {/* Breed beeld direct na de smalle tekst — de sprong in breedte is het
          punt. Negentien foto's stonden alleen op de fotopagina; hier komt de
          plek zelf eindelijk in beeld. */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <h2 className="sr-only">{t("mosaicTitle")}</h2>
        <PhotoMosaic
          cta={t("mosaicCta")}
          photos={[
            { src: "/photos/omgeving-alpengloed-1.jpg", alt: t("mosaic.alpenglow") },
            { src: "/photos/woonkamer-1.jpg", alt: t("mosaic.living") },
            { src: "/photos/omgeving-kerk-maria-alm.jpg", alt: t("mosaic.village") },
            { src: "/photos/keuken-1.jpg", alt: t("mosaic.kitchen") },
            { src: "/photos/omgeving-maria-alm-lucht.jpg", alt: t("mosaic.aerial") },
          ]}
        />
      </section>

      {/* Twee seizoenen tegenover elkaar, tegen de schermranden aan en van
          kant wisselend. Het huis wordt zomer én winter verhuurd; dat mag je
          op de homepage zien in plaats van lezen. */}
      <SeasonSection
        eyebrow={t("winterEyebrow")}
        title={t("winterTitle")}
        text={t("winterText")}
        cta={t("seasonCta")}
        href="/omgeving"
        image={{
          src: "/photos/omgeving-hochkonig-winter.jpg",
          alt: t("winterEyebrow"),
        }}
      />
      <SeasonSection
        reverse
        eyebrow={t("summerEyebrow")}
        title={t("summerTitle")}
        text={t("summerText")}
        cta={t("seasonCta")}
        href="/omgeving"
        image={{
          src: "/photos/omgeving-bergpanorama.jpg",
          alt: t("summerEyebrow"),
        }}
      />

      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
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

      {/* Afsluiter: de pagina eindigde eerst met een linkje naar een andere
          pagina. Nu eindigt hij met de vraag waar het om gaat.
          Groen en niet bruin, en in een kaart in plaats van over de volle
          breedte — de footer is al een bruin vlak, en twee donkere banden met
          een crème kier ertussen zien eruit als een weeffout. */}
      <section className="mx-auto max-w-5xl px-4 pb-4">
        <div className="rounded-card bg-meadow-dark px-6 py-12 text-center text-cream sm:px-10 sm:py-16">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            {t("closingTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-sand">
            {t("closingText")}
          </p>
          <Link
            href="/beschikbaarheid"
            className="mt-7 inline-block rounded-lg bg-sun px-7 py-3.5 text-base font-semibold text-snow transition-colors hover:bg-sun-dark"
          >
            {t("heroCta")}
          </Link>
        </div>
      </section>
    </>
  );
}
