import Image from "next/image";
import { Link } from "@/i18n/navigation";

// Brede seizoenssectie: foto over de halve schermbreedte, tekst ernaast.
// Bewust géén max-w-5xl-omhulsel — dat is precies de smalle middenkolom die de
// rest van de site al heeft. Door deze twee blokken tegen de randen aan te
// zetten (en links/rechts te wisselen) krijgt de pagina ritme in plaats van
// een stapel identieke kaders.
export default function SeasonSection({
  eyebrow,
  title,
  text,
  cta,
  href,
  image,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  href: "/omgeving" | "/appartement";
  image: { src: string; alt: string };
  reverse?: boolean;
}) {
  return (
    <section className="grid items-stretch md:grid-cols-2">
      <div
        className={`relative aspect-[4/3] md:aspect-auto md:min-h-[26rem] ${
          reverse ? "md:order-2" : ""
        }`}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div
        className={`flex items-center bg-sand/50 px-6 py-10 sm:px-10 md:py-16 ${
          reverse ? "md:order-1 md:justify-end" : ""
        }`}
      >
        {/* De tekst blijft leesbaar smal, ook als het blok zelf half zo breed
            is als het scherm. */}
        <div className="max-w-md">
          <p className="font-display text-sm uppercase tracking-[0.18em] text-meadow-dark">
            {eyebrow}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-bark sm:text-3xl">
            {title}
          </h2>
          <p className="mt-4 leading-relaxed text-timber">{text}</p>
          <Link
            href={href}
            className="mt-5 inline-block font-semibold text-meadow-dark underline-offset-4 hover:underline"
          >
            {cta} →
          </Link>
        </div>
      </div>
    </section>
  );
}
