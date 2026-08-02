import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { use } from "react";
import { buildMetadata } from "@/lib/metadata";
import { CONTACT_EMAIL } from "@/lib/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return buildMetadata({
    locale,
    route: "privacy",
    title: t("title"),
    description: t("intro"),
  });
}

// Kleine bouwsteen zodat elke paragraaf dezelfde ritmiek houdt; de pagina is
// puur lopende tekst en heeft de foto-varianten van <Section> niet nodig.
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold text-bark sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-timber">{children}</div>
    </section>
  );
}

export default function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("privacy");

  const dataKeys = ["name", "email", "phone", "dates", "message", "locale"] as const;
  const sharedKeys = ["supabase", "resend", "vercel", "cloudflare"] as const;

  // Het adres staat als <mail>-tag in de vertaling; hier wordt er een echte
  // mailto-link van. De href komt uit config zodat er één bron is.
  const mail = (chunks: React.ReactNode) => (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-semibold text-meadow-dark underline-offset-4 hover:underline"
    >
      {chunks}
    </a>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 pb-12 pt-10">
      <h1 className="font-display text-3xl font-semibold text-bark sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-3 leading-relaxed text-timber">{t("intro")}</p>

      <Block title={t("controllerTitle")}>
        <p>{t.rich("controllerText", { mail })}</p>
      </Block>

      <Block title={t("dataTitle")}>
        <p>{t("dataIntro")}</p>
        <ul className="ml-1 space-y-2 border-l-2 border-sand pl-4">
          {dataKeys.map((key) => (
            <li key={key}>{t(`data.${key}`)}</li>
          ))}
        </ul>
        <p>{t("dataFooter")}</p>
      </Block>

      <Block title={t("whyTitle")}>
        <p>{t("whyText")}</p>
      </Block>

      <Block title={t("retentionTitle")}>
        <p>{t("retentionText")}</p>
      </Block>

      <Block title={t("sharedTitle")}>
        <p>{t("sharedIntro")}</p>
        <ul className="ml-1 space-y-2 border-l-2 border-sand pl-4">
          {sharedKeys.map((key) => (
            <li key={key}>{t(`shared.${key}`)}</li>
          ))}
        </ul>
      </Block>

      <Block title={t("cookiesTitle")}>
        <p>{t("cookiesText")}</p>
      </Block>

      <Block title={t("rightsTitle")}>
        <p>{t.rich("rightsText", { mail })}</p>
      </Block>

      <Block title={t("securityTitle")}>
        <p>{t("securityText")}</p>
      </Block>

      <p className="mt-10 border-t border-sand pt-6 text-sm text-timber/80">
        {t("updated")}
      </p>
    </div>
  );
}
