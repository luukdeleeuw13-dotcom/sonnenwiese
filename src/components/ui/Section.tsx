import Image from "next/image";
import Placeholder from "./Placeholder";

// Generieke contentsectie: kop + lopende tekst + optionele afbeelding
// (placeholder zolang src ontbreekt). Afbeelding wisselt op desktop van kant.
export default function Section({
  title,
  children,
  image,
  reverse = false,
}: {
  title: string;
  children: React.ReactNode;
  image?: {
    src?: string;
    alt: string;
    variant?: "mountain" | "interior" | "garden";
  };
  reverse?: boolean;
}) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <div
        className={`flex flex-col gap-6 sm:items-center ${
          image ? (reverse ? "sm:flex-row-reverse" : "sm:flex-row") : ""
        }`}
      >
        <div className={image ? "sm:w-1/2" : ""}>
          <h2 className="font-display text-2xl font-semibold text-bark sm:text-3xl">
            {title}
          </h2>
          <div className="mt-3 space-y-3 leading-relaxed text-timber">
            {children}
          </div>
        </div>
        {image && (
          <div className="overflow-hidden rounded-card sm:w-1/2">
            <div className="relative aspect-[4/3] w-full">
              {image.src ? (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                />
              ) : (
                <Placeholder variant={image.variant ?? "interior"} />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
