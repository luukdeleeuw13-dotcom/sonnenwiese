"use client";

import { DayPicker, type DateRange, type Matcher } from "react-day-picker";
import { nl, de, enGB } from "react-day-picker/locale";
import { useLocale } from "next-intl";
import "react-day-picker/style.css";
import type { BookedRange } from "./BookingSection";

const dayPickerLocales = { nl, de, en: enGB } as const;

function toDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

// Kalender met geblokkeerde (bevestigde) periodes; selectie van een
// aaneengesloten vrije periode voor de aanvraag.
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

  const booked: Matcher[] = bookedRanges.map((r) => ({
    from: toDate(r.from),
    to: toDate(r.to),
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <DayPicker
      mode="range"
      selected={range}
      onSelect={onSelect}
      // Verleden + bevestigde boekingen zijn niet selecteerbaar; een selectie
      // kan dankzij excludeDisabled ook niet óver een bezette periode heen.
      disabled={[{ before: today }, ...booked]}
      excludeDisabled
      modifiers={{ booked }}
      modifiersClassNames={{ booked: "rdp-booked" }}
      locale={dayPickerLocales[locale] ?? nl}
      numberOfMonths={1}
      className="mx-auto"
    />
  );
}
