import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { buildMetadata } from "@/lib/metadata";
import Gallery, { type GalleryPhoto } from "@/components/ui/Gallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return buildMetadata({
    locale,
    route: "fotos",
    title: t("title"),
    description: t("intro"),
  });
}

export default function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("gallery");
  const ta = useTranslations("apartment");

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
    {
      title: ta("gardenTitle"),
      photos: [{ src: "/photos/tuin-1.jpg", alt: t("captions.garden") }],
    },
  ];

  // Eigen foto's uit Maria Alm; elke foto heeft een eigen omschrijving, want
  // "Omgeving 7" helpt niemand die de site voorgelezen krijgt. Bestandsnaam en
  // sleutel lopen gelijk op, zodat een foto vervangen één regel blijft.
  const toPhotos = (entries: [file: string, caption: string][]): GalleryPhoto[] =>
    entries.map(([file, caption]) => ({
      src: `/photos/${file}.jpg`,
      alt: t(`captions.${caption}`),
    }));

  const surroundingsSummer = toPhotos([
    ["omgeving-zomer-panorama", "summerPanorama"],
    ["omgeving-zomer-bergkam", "summerRidge"],
    ["omgeving-zomer-kerk-bloemen", "summerChurchFlowers"],
    ["omgeving-zomer-schuur", "summerBarn"],
    ["omgeving-zomer-wandelpad", "summerPath"],
    ["omgeving-zomer-almhut", "summerAlpineHut"],
    ["omgeving-zomer-kerk-weide", "summerChurchMeadow"],
    ["omgeving-zomer-kerk", "summerChurch"],
    ["omgeving-zomer-boerderij", "summerFarm"],
    ["omgeving-zomer-wegwijzer", "summerSignpost"],
    ["omgeving-zomer-wandelmarkering", "summerMarker"],
    ["omgeving-zomer-bankje", "summerBench"],
    ["omgeving-zomer-marmotten", "summerMarmots"],
  ]);

  const surroundingsWinter = toPhotos([
    ["omgeving-winter-spiegeling", "winterMirror"],
    ["omgeving-winter-bergkapel", "winterChapel"],
    ["omgeving-winter-gondel", "winterGondola"],
    ["omgeving-winter-hochkonig", "winterMassif"],
    ["omgeving-winter-kapel-weide", "winterFieldChapel"],
    ["omgeving-winter-kerk", "winterChurch"],
    ["omgeving-winter-kerk-nacht-1", "winterChurchNight1"],
    ["omgeving-winter-kerk-nacht-2", "winterChurchNight2"],
    ["omgeving-winter-dorpsstraat", "winterStreet"],
    ["omgeving-winter-chalets", "winterChalets"],
    ["omgeving-winter-weg", "winterRoad"],
    ["omgeving-winter-weide", "winterMeadow"],
    ["omgeving-winter-paarden", "winterHorses"],
    ["omgeving-winter-almhut", "winterHut"],
    ["omgeving-winter-avondlicht", "winterDusk"],
    ["omgeving-winter-dorp-nacht-1", "winterNight1"],
    ["omgeving-winter-dorp-nacht-2", "winterNight2"],
  ]);

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
    </div>
  );
}
