"use client";

import { useState } from "react";
import { DayPicker, type DateRange, type Matcher } from "react-day-picker";
import { nl, de, enGB } from "react-day-picker/locale";
import { useLocale, useTranslations } from "next-intl";
import { addDays } from "date-fns";
import "react-day-picker/style.css";
import { CHANGEOVER_DAY, startOfRentalWeek } from "@/lib/booking/weeks";
import type { BookedRange } from "./BookingSection";

const dayPickerLocales = { nl, de, en: enGB } as const;

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

// Kalender die per hele verhuurweek selecteert (zaterdag → zaterdag).
// Eén klik kiest de week waar de aangeklikte dag in valt; een tweede klik
// verderop rekt de selectie op tot en met die week. Zo hoeft niemand de
// zaterdagen zelf op te zoeken en is een halve week onmogelijk te kiezen.
export default function AvailabilityCalendar({
  bookedRanges,
  range,
  onSelect,
}: {
  bookedRanges: BookedRange[];
  range: DateRange | undefined;
  onSelect: (range: DateRange | undefined) => void;
}) {
  const locale = useLocale() as keyof typeof dayPickerLocales;
  const t = useTranslations("availability");
  // Het beginpunt van een selectie die nog kan groeien. Na de tweede klik
  // is de selectie af en begint een volgende klik overnieuw.
  const [anchor, setAnchor] = useState<Date | undefined>();
  // "bezet" is een fout — er kan niets — en staat er rood bij. "verplaatst"
  // is alleen uitleg: er is wél iets gebeurd, maar iets anders dan je dacht.
  const [melding, setMelding] = useState<"bezet" | "verplaatst" | undefined>();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Een week die al loopt is niet meer te boeken, dus de vroegste
  // aankomstdag is de eerstvolgende wisseldag — vandaag zelf alleen als
  // dat toevallig een zaterdag is.
  const thisWeek = startOfRentalWeek(today);
  const firstArrival =
    thisWeek.getTime() === today.getTime() ? thisWeek : addDays(thisWeek, 7);

  const booked: Matcher[] = bookedRanges.map((r) => ({
    from: toDate(r.from),
    // De vertrekdag is óók de aankomstdag van de volgende gast (10.00 uur
    // eruit, 15.00 uur erin). Die dag als bezet tonen zou elke aansluitende
    // week onboekbaar maken — precies de weken die je juist wilt verhuren.
    to: addDays(toDate(r.to), -1),
  }));

  // Zelfde rekensom als de server: [van, tot) tegen [van, tot), zodat een
  // vertrekdag en een aankomstdag op dezelfde datum elkaar niet bijten.
  const isFree = (from: Date, to: Date) =>
    !bookedRanges.some((r) => from < toDate(r.to) && to > toDate(r.from));

  // Een nieuwe selectie van één week, die daarna nog kan groeien. Geeft terug
  // of het gelukt is; is de week zelf niet helemaal vrij, dan verandert er
  // niets aan wat er staat.
  const beginOpnieuw = (week: Date): boolean => {
    const einde = addDays(week, 7);
    if (!isFree(week, einde)) return false;
    onSelect({ from: week, to: einde });
    setAnchor(week);
    return true;
  };

  const handleClick = (day: Date) => {
    const week = startOfRentalWeek(day);
    // Een beginpunt telt alleen zolang de selectie waar het bij hoort ook
    // echt op het scherm staat.
    const begin = range?.from ? anchor : undefined;

    if (begin && week > begin) {
      const einde = addDays(week, 7);
      if (isFree(begin, einde)) {
        onSelect({ from: begin, to: einde });
        setAnchor(undefined);
        setMelding(undefined);
        return;
      }
      // Uitrekken kan niet: er ligt een bezette periode tussenin. In plaats
      // van de klik weg te gooien wordt deze week het nieuwe beginpunt — dat
      // is wat iemand die daar klikt bedoelt. Hiervóór bleef het oude
      // beginpunt staan, waardoor élke volgende klik verderop dezelfde
      // melding gaf en de enige uitweg was om je eerste week nóg eens aan te
      // klikken.
      setMelding(beginOpnieuw(week) ? "verplaatst" : "bezet");
      return;
    }

    // Eerste klik, tweede klik op dezelfde week, of terug in de tijd.
    setMelding(beginOpnieuw(week) ? undefined : "bezet");
  };

  return (
    <>
      <DayPicker
        mode="range"
        selected={range}
        // De selectie die react-day-picker zelf uitrekent gooien we weg: we
        // hebben alleen de aangeklikte dag nodig om er een week van te
        // maken. Op een uitgeschakelde dag komt deze handler niet.
        onSelect={(_ignored, clicked) => handleClick(clicked)}
        disabled={[{ before: firstArrival }, ...booked]}
        modifiers={{ booked }}
        modifiersClassNames={{ booked: "rdp-booked" }}
        locale={dayPickerLocales[locale] ?? nl}
        // De week begint hier op zaterdag in plaats van op maandag: dan is
        // elke regel in de kalender precies één verhuurweek, en loopt een
        // selectie niet half over twee regels.
        weekStartsOn={CHANGEOVER_DAY}
        numberOfMonths={1}
        className="mx-auto"
      />
      {melding && (
        <p
          role="status"
          className={`mt-1 text-sm ${
            melding === "bezet" ? "text-red-700" : "text-timber"
          }`}
        >
          {t(melding === "bezet" ? "calendarWeekBooked" : "calendarOverlap")}
        </p>
      )}
    </>
  );
}
