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

  // Foto's per categorie. `src` invullen zodra echte foto's in public/photos/
  // staan — zonder src rendert automatisch een placeholder.
  const apartmentPhotos: GalleryPhoto[] = [
    { alt: ta("livingTitle"), variant: "interior" },
    { alt: ta("kitchenTitle"), variant: "interior" },
    { alt: `${ta("bedroomsTitle")} 1`, variant: "interior" },
    { alt: `${ta("bedroomsTitle")} 2`, variant: "interior" },
    { alt: `${ta("bedroomsTitle")} 3`, variant: "interior" },
    { alt: ta("gardenTitle"), variant: "garden" },
  ];

  const surroundingsSummer: GalleryPhoto[] = [
    { alt: ts("villageTitle"), variant: "mountain" },
    { alt: "Hochkönig", variant: "mountain" },
    { alt: ts("summerTitle"), variant: "garden" },
  ];

  const surroundingsWinter: GalleryPhoto[] = [
    { alt: ts("winterTitle"), variant: "mountain" },
    { alt: `${ts("villageTitle")} — ${t("winter")}`, variant: "mountain" },
    { alt: "Hochkönig", variant: "mountain" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-bark sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-2xl text-timber">{t("intro")}</p>

      <h2 className="mt-10 font-display text-2xl font-semibold text-bark">
        {t("categoryApartment")}
      </h2>
      <div className="mt-4">
        <Gallery photos={apartmentPhotos} />
      </div>

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
    </div>
  );
}
