import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { Link } from "@/i18n/navigation";

const rowKeys = ["winterHigh", "winterLow", "summerHigh", "summerLow"] as const;
const includedKeys = ["energy", "internet"] as const;
const extrasKeys = ["cleaning", "tax", "linen"] as const;
const paymentKeys = ["deposit", "cancel", "pets"] as const;

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

      {/* Prijzentabel */}
      <div className="mt-8 overflow-hidden rounded-card border border-sand bg-snow">
        <h2 className="border-b border-sand px-6 py-4 font-display text-2xl font-semibold text-bark">
          {t("tableTitle")}
        </h2>
        <table className="w-full">
          <tbody>
            {rowKeys.map((key, i) => (
              <tr key={key} className={i % 2 === 1 ? "bg-cream/60" : ""}>
                <td className="px-6 py-3.5 text-timber">
                  {t(`rows.${key}.label`)}
                </td>
                <td className="whitespace-nowrap px-6 py-3.5 text-right font-semibold text-bark">
                  {t(`rows.${key}.price`)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-card bg-sand/60 p-6">
          <h2 className="font-display text-xl font-semibold text-bark">
            {t("includedTitle")}
          </h2>
          <ul className="mt-3 space-y-2">
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
        </div>

        <div className="rounded-card bg-sand/60 p-6">
          <h2 className="font-display text-xl font-semibold text-bark">
            {t("extrasTitle")}
          </h2>
          <ul className="mt-3 space-y-2">
            {extrasKeys.map((key) => (
              <li key={key} className="flex items-start gap-2 text-timber">
                <svg
                  className="mt-1 shrink-0 text-sun-dark"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                {t(`extras.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-card border border-sand bg-snow p-6">
        <h2 className="font-display text-xl font-semibold text-bark">
          {t("paymentTitle")}
        </h2>
        <ul className="mt-3 space-y-2 text-timber">
          {paymentKeys.map((key) => (
            <li key={key} className="leading-relaxed">
              {t(`payment.${key}`)}
            </li>
          ))}
        </ul>
        <Link
          href="/beschikbaarheid"
          className="mt-5 inline-block rounded-lg bg-sun px-5 py-3 text-sm font-semibold text-snow transition-colors hover:bg-sun-dark"
        >
          {t("cta")}
        </Link>
      </div>
    </div>
  );
}
