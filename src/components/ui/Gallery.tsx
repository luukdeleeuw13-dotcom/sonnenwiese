"use client";

import { useState } from "react";
import Image from "next/image";
import Placeholder from "./Placeholder";
import PhotoLightbox from "./PhotoLightbox";

export type GalleryPhoto = {
  src?: string; // ontbreekt zolang de echte foto nog niet is aangeleverd
  alt: string;
  variant?: "mountain" | "interior" | "garden";
};

// Responsief fotoraster; klik opent de lightbox.
export default function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative aspect-[4/3] overflow-hidden rounded-card"
          >
            {photo.src ? (
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                // Drie kolommen op desktop, twee op mobiel — zie het raster
                // hierboven. Scheelt op de fotopagina flink, want daar staan
                // ruim dertig foto's onder elkaar.
                sizes="(min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform hover:scale-105"
              />
            ) : (
              <Placeholder variant={photo.variant} />
            )}
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <PhotoLightbox
          photos={photos}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </>
  );
}
