import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { buildMetadata } from "@/lib/metadata";
import { CONTACT_EMAIL } from "@/lib/config";
import { Link } from "@/i18n/navigation";
import InquiryForm from "@/components/inquiry/InquiryForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "inquiry" });
  return buildMetadata({
    locale,
    route: "vragen",
    title: t("title"),
    description: t("intro"),
  });
}

export default function InquiryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("inquiry");

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12 pt-10">
      <h1 className="font-display text-3xl font-semibold text-bark sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 leading-relaxed text-timber">{t("intro")}</p>

      {/* Wie hier per ongeluk beland is en gewoon een hele week wil, hoort
          niet vast te lopen: één klik terug naar de kalender. */}
      <p className="mt-3 leading-relaxed text-timber">
        {t.rich("bookingHint", {
          link: (chunks) => (
            <Link
              href="/beschikbaarheid"
              className="font-semibold text-meadow-dark underline-offset-4 hover:underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>

      <div className="mt-8 rounded-card border border-sand bg-snow p-4 sm:p-6">
        <InquiryForm />
      </div>

      <p className="mt-6 text-sm leading-relaxed text-timber">
        {t.rich("mailAlternative", {
          mail: (chunks) => (
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-meadow-dark underline-offset-4 hover:underline"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
    </div>
  );
}
