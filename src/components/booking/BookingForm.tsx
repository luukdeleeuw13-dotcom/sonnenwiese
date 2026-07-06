"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { nl, de, enGB } from "date-fns/locale";
import BookingConfirmation from "./BookingConfirmation";

const dateLocales = { nl, de, en: enGB } as const;

type FieldErrors = Partial<
  Record<"fullName" | "email" | "dates" | "guests", string>
>;

type Status = "idle" | "submitting" | "success" | "error";

export default function BookingForm({
  range,
  onReset,
}: {
  range: DateRange | undefined;
  onReset: () => void;
}) {
  const t = useTranslations("bookingForm");
  const locale = useLocale() as keyof typeof dateLocales;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [guests, setGuests] = useState(6);
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — mensen laten dit leeg
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  const fmt = (d: Date) =>
    format(d, "d MMM yyyy", { locale: dateLocales[locale] ?? nl });

  const reset = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setGuests(6);
    setMessage("");
    setErrors({});
    setStatus("idle");
    onReset();
  };

  if (status === "success") {
    return <BookingConfirmation onAgain={reset} />;
  }

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!fullName.trim()) errs.fullName = "nameRequired";
    if (!email.trim()) errs.email = "emailRequired";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "emailInvalid";
    if (!range?.from || !range?.to || range.from >= range.to)
      errs.dates = "datesRequired";
    return errs;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          startDate: format(range!.from!, "yyyy-MM-dd"),
          endDate: format(range!.to!, "yyyy-MM-dd"),
          guests,
          message: message.trim() || undefined,
          website: website || undefined,
          locale,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("success");
      } else if ((res.status === 400 || res.status === 409) && json.errors) {
        setErrors(json.errors);
        setStatus("idle");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const err = (key: keyof FieldErrors) =>
    errors[key] ? (
      <p className="mt-1 text-sm text-red-700">
        {t(`validation.${errors[key]}`)}
      </p>
    ) : null;

  const inputClass =
    "mt-1 w-full rounded-lg border border-sand bg-cream px-3 py-2.5 text-bark placeholder:text-timber/50 focus:border-meadow focus:outline-none";

  return (
    <form onSubmit={submit} noValidate>
      {/* Honeypot tegen spam-bots: onzichtbaar voor mensen */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      {/* Geselecteerde periode uit de kalender */}
      <div className="rounded-lg bg-sand/60 px-3 py-2.5 text-sm text-bark">
        <span className="font-medium">{t("dates")}: </span>
        {range?.from && range?.to
          ? t("datesSelected", { from: fmt(range.from), to: fmt(range.to) })
          : t("datesHint")}
      </div>
      {err("dates")}

      <label className="mt-4 block">
        <span className="text-sm font-medium text-bark">{t("name")}</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          className={inputClass}
        />
      </label>
      {err("fullName")}

      <label className="mt-4 block">
        <span className="text-sm font-medium text-bark">{t("email")}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          className={inputClass}
        />
      </label>
      {err("email")}

      <label className="mt-4 block">
        <span className="text-sm font-medium text-bark">{t("phone")}</span>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("phonePlaceholder")}
          autoComplete="tel"
          className={inputClass}
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-bark">{t("guests")}</span>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className={inputClass}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      {err("guests")}

      <label className="mt-4 block">
        <span className="text-sm font-medium text-bark">{t("message")}</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          rows={4}
          className={inputClass}
        />
      </label>

      {status === "error" && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="font-medium text-red-800">{t("errorTitle")}</p>
          <p className="mt-1 text-sm text-red-700">{t("errorText")}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 w-full rounded-lg bg-sun px-6 py-3.5 text-base font-semibold text-snow transition-colors hover:bg-sun-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
