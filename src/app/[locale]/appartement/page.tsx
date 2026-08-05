import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import Image from "next/image";
import { buildMetadata } from "@/lib/metadata";
import Hero from "@/components/ui/Hero";
import Section from "@/components/ui/Section";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "apartment" });
  return buildMetadata({
    locale,
    route: "appartement",
    title: t("title"),
    description: t("intro"),
  });
}

const amenityKeys = [
  "guests",
  "bedrooms",
  "kitchen",
  "washer",
  "tv",
  "internet",
  "bathroom",
  "garden",
  "view",
  "seasons",
] as const;

export default function ApartmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("apartment");

  return (
    <>
      {/* Geen foto van het gebouw hierboven — dat is niet waar iemand voor
          komt, en het pand is nu eenmaal geen plaatje. De woonkamer over de
          volle breedte is wél wat je huurt: één blik en je ziet dat het ruimer
          is dan een appartement doet vermoeden. Deze opname is bovendien het
          scherpst van alles wat we hebben (1170 px breed in plaats van 1024). */}
      <Hero
        title={t("title")}
        subtitle={t("intro")}
        src="/photos/woonkamer-3.jpg"
        alt={t("livingTitle")}
        size="small"
      />

      <Section
        title={t("livingTitle")}
        image={{ src: "/photos/woonkamer-1.jpg", alt: t("livingTitle") }}
      >
        <p>{t("livingText")}</p>
      </Section>

      <Section
        title={t("kitchenTitle")}
        image={{ src: "/photos/keuken-1.jpg", alt: t("kitchenTitle") }}
        reverse
      >
        <p>{t("kitchenText")}</p>
      </Section>

      {/* Drie slaapkamers → drie foto's naast elkaar in plaats van één */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <h2 className="font-display text-2xl font-semibold text-bark sm:text-3xl">
          {t("bedroomsTitle")}
        </h2>
        <p className="mt-3 leading-relaxed text-timber">{t("bedroomsText")}</p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="relative aspect-[3/4] overflow-hidden rounded-card"
            >
              <Image
                src={`/photos/slaapkamer-${n}.jpg`}
                alt={`${t("bedroomsTitle")} ${n}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      <Section
        title={t("bathroomTitle")}
        image={{ src: "/photos/badkamer-1.jpg", alt: t("bathroomTitle") }}
        reverse
      >
        <p>{t("bathroomText")}</p>
      </Section>

      <Section
        title={t("gardenTitle")}
        image={{ src: "/photos/tuin-1.jpg", alt: t("gardenTitle") }}
      >
        <p>{t("gardenText")}</p>
      </Section>

      <section className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-card border border-sand bg-snow p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-bark">
            {t("amenitiesTitle")}
          </h2>
          <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {amenityKeys.map((key) => (
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
                {t(`amenities.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
