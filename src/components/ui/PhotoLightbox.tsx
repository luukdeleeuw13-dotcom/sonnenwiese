"use client";

import { useCallback, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import Placeholder from "./Placeholder";
import type { GalleryPhoto } from "./Gallery";

// Eenvoudige fullscreen-lightbox zonder externe library.
export default function PhotoLightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: GalleryPhoto[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const t = useTranslations("gallery");
  const photo = photos[index];

  const prev = useCallback(
    () => onNavigate((index - 1 + photos.length) % photos.length),
    [index, photos.length, onNavigate]
  );
  const next = useCallback(
    () => onNavigate((index + 1) % photos.length),
    [index, photos.length, onNavigate]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bark/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label={t("lightboxClose")}
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-snow/15 text-snow hover:bg-snow/25"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="19" y1="5" x2="5" y2="19" />
        </svg>
      </button>

      <button
        type="button"
        aria-label={t("lightboxPrev")}
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-snow/15 text-snow hover:bg-snow/25 sm:left-4"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 6 9 12 15 18" />
        </svg>
      </button>

      <div
        className="relative aspect-[4/3] w-full max-w-3xl overflow-hidden rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        {photo.src ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            className="object-contain"
          />
        ) : (
          <Placeholder variant={photo.variant} />
        )}
      </div>

      <button
        type="button"
        aria-label={t("lightboxNext")}
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-snow/15 text-snow hover:bg-snow/25 sm:right-4"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 6 15 12 9 18" />
        </svg>
      </button>

      <p className="absolute bottom-4 text-sm text-cream">
        {photo.alt} · {index + 1}/{photos.length}
      </p>
    </div>
  );
}
