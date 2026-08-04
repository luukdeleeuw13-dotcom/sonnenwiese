"use client";

import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  estimatePrice,
  formatPrice,
  type SeasonKey,
} from "@/lib/booking/seasons";

// Wat de gekozen weken kosten, meteen onder de kalender.
//
// De prijzenpagina had het antwoord al, maar dan moest je zelf uitzoeken of
// jouw week hoogseizoen is en heen en weer klikken tussen twee pagina's —
// terwijl de site die rekensom allang maakt voor de nota. Hier komt hetzelfde
// bedrag uit als in de betaalmail, want het is letterlijk dezelfde functie.
export default function PriceSummary({ range }: { range: DateRange | undefined }) {
  const t = useTranslations("availability");
  const tp = useTranslations("pricing");
  const locale = useLocale();

  if (!range?.from || !range?.to) return null;

  const iso = (date: Date) => format(date, "yyyy-MM-dd");
  const estimate = estimatePrice(iso(range.from), iso(range.to));

  // Buiten de looptijd van de seizoenstabel weten we het niet, en dan zeggen we
  // dat ook. Een gokje hier zou een bedrag noemen dat de nota later tegenspreekt.
  if (!estimate.ok) {
    return (
      <p className="mt-3 border-t border-sand pt-3 text-sm text-timber">
        {t("priceUnknown")}
      </p>
    );
  }

  // Weken van hetzelfde seizoen bij elkaar: "2 × winter — laagseizoen" leest
  // prettiger dan twee identieke regels onder elkaar.
  const groups = new Map<SeasonKey, { count: number; cents: number }>();
  for (const week of estimate.weeks) {
    const group = groups.get(week.season) ?? { count: 0, cents: 0 };
    groups.set(week.season, {
      count: group.count + 1,
      cents: group.cents + week.cents,
    });
  }

  const weeks = estimate.weeks.length;

  return (
    <div className="mt-3 border-t border-sand pt-3">
      <p className="text-sm font-semibold text-bark">
        {t("priceWeeks", { count: weeks })}
      </p>
      <dl className="mt-2 space-y-1.5 text-sm">
        {[...groups].map(([season, group]) => (
          <div key={season} className="flex justify-between gap-4">
            {/* De korte seizoensnaam ("Hoogseizoen winter"), niet het label uit
                de prijzentabel: dat draagt "(schoolvakanties)" mee en brak hier
                op een telefoon over twee regels. */}
            <dt className="text-timber">
              {group.count > 1 && `${group.count} × `}
              {tp(`seasons.${season}`)}
            </dt>
            <dd className="whitespace-nowrap font-medium text-bark">
              {formatPrice(group.cents, locale)}
            </dd>
          </div>
        ))}
        {/* De totaalregel alleen als er iets op te tellen valt; bij één week
            zou hij hetzelfde bedrag nog een keer herhalen. */}
        {weeks > 1 && (
          <div className="flex justify-between gap-4 border-t border-sand pt-1.5">
            <dt className="font-semibold text-bark">{t("priceTotal")}</dt>
            <dd className="whitespace-nowrap font-semibold text-bark">
              {formatPrice(estimate.totalCents, locale)}
            </dd>
          </div>
        )}
      </dl>
      <p className="mt-2 text-xs text-timber">{t("priceNote")}</p>
    </div>
  );
}
