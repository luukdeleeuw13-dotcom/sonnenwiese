"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = [
  { href: "/", key: "home" },
  { href: "/appartement", key: "apartment" },
  { href: "/fotos", key: "gallery" },
  { href: "/omgeving", key: "surroundings" },
  { href: "/prijzen", key: "pricing" },
  { href: "/beschikbaarheid", key: "availability" },
  { href: "/route-praktisch", key: "practical" },
] as const;

export default function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-bark"
          onClick={() => setOpen(false)}
        >
          Sonnenwiese
        </Link>

        {/* Desktop-navigatie */}
        <nav className="hidden items-center gap-5 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`text-sm transition-colors hover:text-meadow-dark ${
                pathname === item.href
                  ? "font-semibold text-meadow-dark"
                  : "text-timber"
              }`}
            >
              {t(item.key)}
            </Link>
          ))}
          <LanguageSwitcher />
        </nav>

        {/* Mobiel: taalknop + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            aria-label={open ? t("menuClose") : t("menuOpen")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-bark hover:bg-sand"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              {open ? (
                <>
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </>
              ) : (
                <>
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobiel uitklapmenu */}
      {open && (
        <nav className="border-t border-sand bg-cream px-4 pb-4 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-3 text-base ${
                    pathname === item.href
                      ? "bg-sand font-semibold text-meadow-dark"
                      : "text-bark hover:bg-sand"
                  }`}
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
