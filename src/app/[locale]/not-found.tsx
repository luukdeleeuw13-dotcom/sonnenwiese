import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFoundPage() {
  const t = useTranslations("notFound");

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-semibold text-bark">
        {t("title")}
      </h1>
      <p className="mt-3 text-timber">{t("text")}</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-sun px-5 py-3 text-sm font-semibold text-snow transition-colors hover:bg-sun-dark"
      >
        {t("cta")}
      </Link>
    </div>
  );
}
