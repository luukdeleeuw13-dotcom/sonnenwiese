import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-16 bg-bark text-cream">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold">Sonnenwiese</p>
          <p className="mt-1 max-w-md text-sm text-sand">{t("tagline")}</p>
          <p className="mt-2 text-sm text-sand/80">{t("location")}</p>
        </div>
        <Link
          href="/beschikbaarheid"
          className="inline-block rounded-lg bg-sun px-5 py-3 text-center text-sm font-semibold text-snow transition-colors hover:bg-sun-dark"
        >
          {t("availabilityCta")}
        </Link>
      </div>
    </footer>
  );
}
