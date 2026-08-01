"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// Vangt fouten binnen een pagina (bv. Supabase onbereikbaar bij het laden
// van de kalender). Zonder dit bestand krijgt de bezoeker het kale,
// technische foutscherm van Next.js te zien.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error("Pagina-fout:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-semibold text-bark">
        {t("title")}
      </h1>
      <p className="mt-3 text-timber">{t("text")}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-sun px-5 py-3 text-sm font-semibold text-snow transition-colors hover:bg-sun-dark"
        >
          {t("retry")}
        </button>
        <Link
          href="/"
          className="rounded-lg border border-timber/30 px-5 py-3 text-sm font-semibold text-bark transition-colors hover:bg-sand/60"
        >
          {t("home")}
        </Link>
      </div>
    </div>
  );
}
