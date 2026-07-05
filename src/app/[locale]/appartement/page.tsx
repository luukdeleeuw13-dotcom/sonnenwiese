import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import Hero from "@/components/ui/Hero";
import Section from "@/components/ui/Section";

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
      <Hero title={t("title")} subtitle={t("intro")} alt={t("title")} size="small" />

      <Section
        title={t("livingTitle")}
        image={{ alt: t("livingTitle"), variant: "interior" }}
      >
        <p>{t("livingText")}</p>
      </Section>

      <Section
        title={t("kitchenTitle")}
        image={{ alt: t("kitchenTitle"), variant: "interior" }}
        reverse
      >
        <p>{t("kitchenText")}</p>
      </Section>

      <Section
        title={t("bedroomsTitle")}
        image={{ alt: t("bedroomsTitle"), variant: "interior" }}
      >
        <p>{t("bedroomsText")}</p>
      </Section>

      <Section
        title={t("bathroomTitle")}
        image={{ alt: t("bathroomTitle"), variant: "interior" }}
        reverse
      >
        <p>{t("bathroomText")}</p>
      </Section>

      <Section
        title={t("gardenTitle")}
        image={{ alt: t("gardenTitle"), variant: "garden" }}
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
