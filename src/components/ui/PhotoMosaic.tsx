import Image from "next/image";
import { Link } from "@/i18n/navigation";

export type MosaicPhoto = { src: string; alt: string };

// Asymmetrisch fotoraster: één grote foto links, vier kleinere ernaast in
// wisselende breedtes. Vijf foto's, want zes werd rommelig en vier te braaf.
//
// Op mobiel valt het raster terug op twee kolommen met de grote foto over de
// volle breedte — een 6-koloms raster op 375px levert postzegels op.
const SPANS = [
  "sm:col-span-3 sm:row-span-2",
  "sm:col-span-2",
  "sm:col-span-1",
  "sm:col-span-2",
  "sm:col-span-1",
];

export default function PhotoMosaic({
  photos,
  cta,
}: {
  photos: MosaicPhoto[];
  cta: string;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:aspect-[2/1] sm:grid-cols-6 sm:grid-rows-2 sm:gap-3">
        {photos.slice(0, 5).map((photo, i) => (
          <Link
            key={photo.src}
            href="/fotos"
            // De eerste foto is op mobiel de enige die over beide kolommen
            // gaat; de rest komt netjes in paren onder elkaar.
            className={`group relative overflow-hidden rounded-card ${
              i === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"
            } sm:aspect-auto ${SPANS[i]}`}
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              // De grote foto is op desktop halve schermbreedte, de kleine
              // ongeveer een kwart; op mobiel altijd (bijna) de volle breedte.
              sizes={
                i === 0
                  ? "(min-width: 640px) 50vw, 100vw"
                  : "(min-width: 640px) 25vw, 50vw"
              }
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            {/* Nauwelijks zichtbaar, maar het maakt van vijf losse plaatjes
                één vlak en houdt de randen rustig. */}
            <span className="absolute inset-0 bg-bark/0 transition-colors duration-300 group-hover:bg-bark/10" />
          </Link>
        ))}
      </div>

      <Link
        href="/fotos"
        className="mt-4 inline-block font-semibold text-meadow-dark underline-offset-4 hover:underline"
      >
        {cta} →
      </Link>
    </div>
  );
}
