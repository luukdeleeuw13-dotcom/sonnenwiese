import { useTranslations } from "next-intl";

type Variant = "mountain" | "interior" | "garden";

const gradients: Record<Variant, string> = {
  mountain: "from-sky/60 via-sand to-meadow/40",
  interior: "from-sand via-cream to-timber/25",
  garden: "from-meadow/40 via-sand to-sun/30",
};

// Placeholder voor foto's die nog niet zijn aangeleverd: gradient in het
// themapalet + berg-icoon + "Foto volgt".
export default function Placeholder({
  variant = "mountain",
  label,
  className = "",
}: {
  variant?: Variant;
  label?: string;
  className?: string;
}) {
  const t = useTranslations("common");

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br ${gradients[variant]} ${className}`}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-bark/50"
      >
        <path d="M3 20 9 8l3.5 6L15 10l6 10Z" />
        <circle cx="17.5" cy="5.5" r="1.5" />
      </svg>
      <span className="text-xs font-medium uppercase tracking-wide text-bark/50">
        {label ?? t("photoComingSoon")}
      </span>
    </div>
  );
}
