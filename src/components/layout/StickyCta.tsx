"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { MIN_WEEK_PRICE_CENTS, formatPrice } from "@/lib/booking/seasons";

// Zwevende balk met de prijs en de knop, alleen op een telefoon.
//
// Op een klein scherm scrolt de knop uit de hero weg en komt hij pas honderden
// pixels verderop in de footer terug. Precies daartussen leest iemand alles
// waardoor hij wil boeken. Deze balk vangt dat gat op.
export default function StickyCta() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [zichtbaar, setZichtbaar] = useState(false);

  useEffect(() => {
    // Twee grenzen: pas ná de hero verschijnen, en weer verdwijnen zodra de
    // footer in beeld komt — daar staat dezelfde knop al, en twee amberknoppen
    // tegelijk in beeld leest als een fout.
    //
    // De paginahoogte wordt apart bijgehouden in plaats van bij elke scroll
    // opnieuw opgevraagd: scrollHeight uitlezen dwingt de browser tot een
    // herberekening van de opmaak, en dat honderden keren per scrollbeweging
    // doen is precies waar een pagina schokkerig van wordt. De ResizeObserver
    // ververst hem als de pagina van hoogte verandert, bijvoorbeeld doordat
    // foto's binnenkomen.
    let paginaHoogte = 0;
    const bepaal = () => {
      const y = window.scrollY;
      const onder = paginaHoogte - (y + window.innerHeight);
      setZichtbaar(y > 420 && onder > 260);
    };
    const hermeten = () => {
      paginaHoogte = document.documentElement.scrollHeight;
      bepaal();
    };
    hermeten();
    const observer = new ResizeObserver(hermeten);
    observer.observe(document.body);
    window.addEventListener("scroll", bepaal, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", bepaal);
    };
  }, []);

  // Op de beschikbaarheidspagina is de bezoeker er al; daar zou de balk de
  // kalender alleen maar afdekken.
  if (pathname === "/beschikbaarheid") return null;

  return (
    <div
      // aria-hidden zolang hij weg is: een schermlezer moet niet door een
      // onzichtbare knop lopen, en de knop staat sowieso in de footer.
      aria-hidden={!zichtbaar}
      className={`sticky-cta fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-cream/95 backdrop-blur sm:hidden ${
        zichtbaar
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0"
      }`}
      // De thuisknopbalk van een iPhone zit onder de onderrand van het scherm.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="whitespace-nowrap text-sm font-semibold text-bark">
          {tc("priceFrom", { price: formatPrice(MIN_WEEK_PRICE_CENTS, locale) })}
        </span>
        <Link
          href="/beschikbaarheid"
          tabIndex={zichtbaar ? undefined : -1}
          className="rounded-lg bg-sun px-4 py-2.5 text-sm font-semibold text-snow transition-colors hover:bg-sun-dark"
        >
          {t("availabilityCta")}
        </Link>
      </div>
    </div>
  );
}
