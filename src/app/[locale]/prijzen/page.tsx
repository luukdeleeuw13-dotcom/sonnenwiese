import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";

const includedKeys = ["linen", "energy", "internet", "cleaning"] as const;

export default function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("pricing");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold text-bark sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 max-w-2xl text-timber">{t("intro")}</p>

      {/* Prijzen zijn nog niet aangeleverd door de eigenaar — bewust een
          nette "volgt binnenkort" in plaats van verzonnen bedragen. */}
      <div className="mt-8 rounded-card border border-sand bg-snow p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-bark">
          {t("comingSoonTitle")}
        </h2>
        <p className="mt-3 max-w-2xl leading-relaxed text-timber">
          {t("comingSoonText")}
        </p>
        <Link
          href="/beschikbaarheid"
          className="mt-5 inline-block rounded-lg bg-sun px-5 py-3 text-sm font-semibold text-snow transition-colors hover:bg-sun-dark"
        >
          {t("cta")}
        </Link>
      </div>

      <div className="mt-6 rounded-card bg-sand/60 p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-bark">
          {t("includedTitle")}
        </h2>
        <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {includedKeys.map((key) => (
            <li key={key} className="flex items-start gap-2 text-timber">
              <svg
                className="mt-1 shrink-0 text-meadow"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="4 12 10 18 20 6" />
              </svg>
              {t(`included.${key}`)}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-timber/80">{t("includedNote")}</p>
      </div>
    </div>
  );
}
