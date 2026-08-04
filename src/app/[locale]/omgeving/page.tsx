import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { buildMetadata } from "@/lib/metadata";
import Hero from "@/components/ui/Hero";
import Section from "@/components/ui/Section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "surroundings" });
  return buildMetadata({
    locale,
    route: "omgeving",
    title: t("title"),
    description: t("intro"),
  });
}

const distanceKeys = ["skibus", "skilift", "village", "piste"] as const;

export default function SurroundingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("surroundings");

  return (
    <>
      <Hero
        title={t("title")}
        subtitle={t("intro")}
        src="/photos/omgeving-winter-weide.jpg"
        alt={t("title")}
        size="small"
      />

      <Section
        title={t("villageTitle")}
        image={{
          src: "/photos/omgeving-winter-dorpsstraat.jpg",
          alt: t("villageTitle"),
        }}
      >
        <p>{t("villageText")}</p>
      </Section>

      <Section
        title={t("winterTitle")}
        image={{
          src: "/photos/omgeving-winter-bergkapel.jpg",
          alt: t("winterTitle"),
        }}
        reverse
      >
        <p>{t("winterText")}</p>
      </Section>

      <Section
        title={t("summerTitle")}
        image={{
          src: "/photos/omgeving-zomer-bergkam.jpg",
          alt: t("summerTitle"),
        }}
      >
        <p>{t("summerText")}</p>
      </Section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-card bg-sand/60 p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-bark">
            {t("distancesTitle")}
          </h2>
          <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {distanceKeys.map((key) => (
              <li key={key} className="flex items-start gap-2 text-timber">
                <svg
                  className="mt-1 shrink-0 text-meadow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="10" r="3" />
                  <path d="M12 2a8 8 0 0 1 8 8c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 8-8Z" />
                </svg>
                {t(`distances.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
