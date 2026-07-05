"use client";

import { useTranslations } from "next-intl";

export default function BookingConfirmation({
  onAgain,
}: {
  onAgain: () => void;
}) {
  const t = useTranslations("bookingForm");

  return (
    <div className="py-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-meadow/15 text-meadow-dark">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 12 10 18 20 6" />
        </svg>
      </div>
      <h3 className="mt-4 font-display text-2xl font-semibold text-bark">
        {t("successTitle")}
      </h3>
      <p className="mx-auto mt-2 max-w-sm leading-relaxed text-timber">
        {t("successText")}
      </p>
      <button
        type="button"
        onClick={onAgain}
        className="mt-6 text-sm font-semibold text-meadow-dark underline-offset-4 hover:underline"
      >
        {t("successAgain")}
      </button>
    </div>
  );
}
