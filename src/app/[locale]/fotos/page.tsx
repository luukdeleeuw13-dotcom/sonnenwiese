import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import Gallery, { type GalleryPhoto } from "@/components/ui/Gallery";

export default function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("gallery");
  const ta = useTranslations("apartment");
  const ts = useTranslations("surroundings");

  // Foto's van het appartement (aangeleverd door de eigenaar), per ruimte.
  const groups: { title: string; photos: GalleryPhoto[] }[] = [
    {
      title: ta("livingTitle"),
      photos: [1, 2, 3, 4, 5, 6].map((n) => ({
        src: `/photos/woonkamer-${n}.jpg`,
        alt: `${ta("livingTitle")} ${n}`,
      })),
    },
    {
      title: ta("kitchenTitle"),
      photos: [1, 2].map((n) => ({
        src: `/photos/keuken-${n}.jpg`,
        alt: `${ta("kitchenTitle")} ${n}`,
      })),
    },
    {
      title: ta("bedroomsTitle"),
      photos: [1, 2, 3].map((n) => ({
        src: `/photos/slaapkamer-${n}.jpg`,
        alt: `${ta("bedroomsTitle")} ${n}`,
      })),
    },
    {
      title: ta("bathroomTitle"),
      photos: [{ src: "/photos/badkamer-1.jpg", alt: ta("bathroomTitle") }],
    },
  ];

  // Omgevingsfoto's via Wikimedia Commons (zie gallery.credits).
  const surroundingsSummer: GalleryPhoto[] = [
    { src: "/photos/omgeving-hochkonig-zomer.jpg", alt: "Hochkönig" },
    { src: "/photos/omgeving-kerk-maria-alm.jpg", alt: ts("villageTitle") },
    { src: "/photos/omgeving-maria-alm-lucht.jpg", alt: ts("villageTitle") },
    { src: "/photos/omgeving-bergpanorama.jpg", alt: ts("summerTitle") },
  ];

  const surroundingsWinter: GalleryPhoto[] = [
    { src: "/photos/omgeving-hochkonig-winter.jpg", alt: ts("winterTitle") },
    { src: "/photos/omgeving-alpengloed-1.jpg", alt: `Hochkönig — ${t("winter")}` },
    { src: "/photos/omgeving-alpengloed-2.jpg", alt: `Hochkönig — ${t("winter")}` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-bark sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-2xl text-timber">{t("intro")}</p>

      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="mt-10 font-display text-2xl font-semibold text-bark">
            {group.title}
          </h2>
          <div className="mt-4">
            <Gallery photos={group.photos} />
          </div>
        </section>
      ))}

      <h2 className="mt-10 font-display text-2xl font-semibold text-bark">
        {t("categorySurroundings")} — {t("summer")}
      </h2>
      <div className="mt-4">
        <Gallery photos={surroundingsSummer} />
      </div>

      <h2 className="mt-10 font-display text-2xl font-semibold text-bark">
        {t("categorySurroundings")} — {t("winter")}
      </h2>
      <div className="mt-4">
        <Gallery photos={surroundingsWinter} />
      </div>

      <p className="mt-10 text-xs text-timber/70">{t("credits")}</p>
    </div>
  );
}
