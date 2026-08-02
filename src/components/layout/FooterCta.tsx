"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

// De footerknop is op de meeste pagina's een welkome afsluiter, maar de
// homepage eindigt sinds de herindeling al met een eigen uitnodiging. Twee
// identieke amberknoppen onder elkaar leest als een fout, dus daar slaan we
// hem over. Alleen dit knopje is een client component; de rest van de footer
// blijft server-rendered.
export default function FooterCta() {
  const t = useTranslations("footer");
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Link
      href="/beschikbaarheid"
      className="inline-block rounded-lg bg-sun px-5 py-3 text-center text-sm font-semibold text-snow transition-colors hover:bg-sun-dark"
    >
      {t("availabilityCta")}
    </Link>
  );
}
