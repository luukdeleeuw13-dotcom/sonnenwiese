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
  const [overlap, setOverlap] = useState(false);

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

  const select = (from: Date, to: Date): boolean => {
    if (!isFree(from, to)) {
      // Niet stilzwijgend negeren: de gast klikte ergens op, dus vertel
      // waarom er niets gebeurt.
      setOverlap(true);
      return false;
    }
    setOverlap(false);
    onSelect({ from, to });
    return true;
  };

  const handleClick = (day: Date) => {
    const week = startOfRentalWeek(day);
    // Nog geen open selectie, of er is er al één afgerond, of er wordt
    // terugwaarts geklikt: begin opnieuw bij deze ene week.
    if (!anchor || !range?.from || week < anchor) {
      if (select(week, addDays(week, 7))) setAnchor(week);
      return;
    }
    if (select(anchor, addDays(week, 7))) setAnchor(undefined);
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
      {overlap && (
        <p role="status" className="mt-1 text-sm text-red-700">
          {t("calendarOverlap")}
        </p>
      )}
    </>
  );
}
