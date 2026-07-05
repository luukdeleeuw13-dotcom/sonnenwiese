"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { useTranslations } from "next-intl";
import AvailabilityCalendar from "./AvailabilityCalendar";
import BookingForm from "./BookingForm";

export type BookedRange = { from: string; to: string }; // yyyy-MM-dd

// Client-schil die de kalenderselectie en het formulier verbindt:
// de gekozen periode in de kalender is de periode van de aanvraag.
export default function BookingSection({
  bookedRanges,
}: {
  bookedRanges: BookedRange[];
}) {
  const t = useTranslations("availability");
  const [range, setRange] = useState<DateRange | undefined>();

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-2">
      <section>
        <h2 className="font-display text-2xl font-semibold text-bark">
          {t("calendarTitle")}
        </h2>
        <p className="mt-1 text-sm text-timber">{t("calendarHint")}</p>
        <div className="mt-4 rounded-card border border-sand bg-snow p-4">
          <AvailabilityCalendar
            bookedRanges={bookedRanges}
            range={range}
            onSelect={setRange}
          />
          <div className="mt-2 flex flex-wrap gap-4 border-t border-sand pt-3 text-sm text-timber">
            <span className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded bg-sand line-through" />
              {t("calendarLegendBooked")}
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-3.5 w-3.5 rounded bg-meadow" />
              {t("calendarLegendSelected")}
            </span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-bark">
          {t("formTitle")}
        </h2>
        <div className="mt-4 rounded-card border border-sand bg-snow p-4 sm:p-6">
          <BookingForm range={range} onReset={() => setRange(undefined)} />
        </div>
      </section>
    </div>
  );
}
