import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import FooterCta from "./FooterCta";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-16 bg-bark text-cream">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold">Sonnenwiese</p>
          <p className="mt-1 max-w-md text-sm text-sand">{t("tagline")}</p>
          <p className="mt-2 text-sm text-sand/80">{t("location")}</p>
          <Link
            href="/privacy"
            className="mt-3 inline-block text-sm text-sand/80 underline-offset-4 hover:text-cream hover:underline"
          >
            {t("privacy")}
          </Link>
        </div>
        <FooterCta />
      </div>
    </footer>
  );
}
