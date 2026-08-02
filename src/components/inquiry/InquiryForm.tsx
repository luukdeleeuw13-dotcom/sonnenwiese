"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type FieldErrors = Partial<Record<"fullName" | "email" | "message", string>>;

type Status = "idle" | "submitting" | "success" | "error";

export default function InquiryForm() {
  const t = useTranslations("inquiry");
  const locale = useLocale();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [period, setPeriod] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — mensen laten dit leeg
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  if (status === "success") {
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
        <h2 className="mt-4 font-display text-2xl font-semibold text-bark">
          {t("successTitle")}
        </h2>
        <p className="mx-auto mt-2 max-w-sm leading-relaxed text-timber">
          {t("successText")}
        </p>
        <button
          type="button"
          onClick={() => {
            setFullName("");
            setEmail("");
            setPhone("");
            setPeriod("");
            setMessage("");
            setErrors({});
            setStatus("idle");
          }}
          className="mt-6 text-sm font-semibold text-meadow-dark underline-offset-4 hover:underline"
        >
          {t("successAgain")}
        </button>
      </div>
    );
  }

  const validate = (): FieldErrors => {
    const errs: FieldErrors = {};
    if (!fullName.trim()) errs.fullName = "nameRequired";
    if (!email.trim()) errs.email = "emailRequired";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "emailInvalid";
    if (!message.trim()) errs.message = "messageRequired";
    return errs;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          period: period.trim() || undefined,
          message: message.trim(),
          website: website || undefined,
          locale,
        }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setStatus("success");
      } else if (res.status === 400 && json.errors) {
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
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
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

      <label className="block">
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

      {/* Vrije tekst en geen kalender: dit formulier bestaat juist voor de
          periodes die de kalender niet aanbiedt. */}
      <label className="mt-4 block">
        <span className="text-sm font-medium text-bark">{t("period")}</span>
        <input
          type="text"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          placeholder={t("periodPlaceholder")}
          className={inputClass}
        />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-bark">{t("message")}</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("messagePlaceholder")}
          rows={5}
          className={inputClass}
        />
      </label>
      {err("message")}

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

      <p className="mt-3 text-center text-xs leading-relaxed text-timber/80">
        {t.rich("privacyNote", {
          link: (chunks) => (
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-timber"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </form>
  );
}
