import Image from "next/image";
import Placeholder from "./Placeholder";

// Grote sfeerafbeelding met titel en optionele CTA. Zolang er geen foto is
// aangeleverd (src undefined) rendert de Placeholder-gradient.
export default function Hero({
  title,
  subtitle,
  cta,
  src,
  alt,
  size = "large",
}: {
  title: string;
  subtitle?: string;
  cta?: React.ReactNode;
  src?: string;
  alt: string;
  size?: "large" | "small";
}) {
  return (
    <section
      className={`relative w-full overflow-hidden ${
        size === "large" ? "min-h-[70svh]" : "min-h-[36svh]"
      } flex items-end`}
    >
      <div className="absolute inset-0">
        {src ? (
          <Image src={src} alt={alt} fill priority className="object-cover" />
        ) : (
          <Placeholder variant="mountain" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bark/70 via-bark/10 to-transparent" />
      </div>
      <div className="relative mx-auto w-full max-w-5xl px-4 pb-10 pt-24 sm:pb-14">
        <h1 className="font-display text-4xl font-semibold text-snow drop-shadow sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-xl text-base text-cream drop-shadow sm:text-lg">
            {subtitle}
          </p>
        )}
        {cta && <div className="mt-6">{cta}</div>}
      </div>
    </section>
  );
}
