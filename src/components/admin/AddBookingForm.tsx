"use client";

import { startTransition, useActionState, useState } from "react";
import { addBooking } from "@/app/admin/actions";
import { MAX_GUESTS } from "@/lib/booking/capacity";
import type { FormState } from "@/lib/admin/forms";

const inputStyles =
  "mt-1 block w-full rounded-lg border border-sand bg-cream px-3 py-2 text-bark";

const empty = {
  startDate: "",
  endDate: "",
  fullName: "",
  email: "",
  phone: "",
  guests: "2",
  locale: "nl",
  kind: "guest",
  note: "",
  notify: false,
};

// Een boeking die buiten de site om is afgesproken, zelf in de agenda zetten.
// De invoer staat in React, zodat een foutmelding van de server (de periode is
// al bezet) niet betekent dat je alles opnieuw moet intikken.
export default function AddBookingForm() {
  const [values, setValues] = useState(empty);
  const [state, action, pending] = useActionState<FormState, FormData>(
    async (previous, formData) => {
      const result = await addBooking(previous, formData);
      // Pas leegmaken als het gelukt is: dan is het formulier klaar voor de
      // volgende, en kan dezelfde boeking er niet per ongeluk twee keer in.
      if (result?.ok) setValues(empty);
      return result;
    },
    null,
  );

  const set = (patch: Partial<typeof empty>) =>
    setValues((current) => ({ ...current, ...patch }));
  const family = values.kind === "family";

  return (
    <form
      // Zelf versturen in plaats van via `action`: React zet een formulier na
      // een actie terug naar zijn beginstand, en bij een keuzelijst wint dat
      // van wat er in de state staat — hij sprong na elke foutmelding terug
      // naar de eerste optie terwijl de rest bleef staan.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="mt-3 rounded-card border border-sand bg-snow p-4"
    >
      <fieldset>
        <legend className="text-sm font-medium text-bark">Wie komt er?</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            ["guest", "Gast", "betaalt huur, krijgt een nota"],
            ["family", "Familie", "geen nota, geen betaalverzoek"],
          ].map(([value, label, hint]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                values.kind === value
                  ? "border-meadow-dark bg-meadow/10 text-bark"
                  : "border-sand bg-cream text-timber"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={value}
                checked={values.kind === value}
                onChange={() =>
                  set({
                    kind: value,
                    // Familie krijgt geen bevestigingsmail aangeboden als er
                    // geen adres hoeft te zijn.
                    notify: value === "family" ? false : values.notify,
                  })
                }
                className="mt-0.5"
              />
              <span>
                <span className="font-semibold">{label}</span>
                <span className="block text-timber">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-bark">Aankomst</span>
          <input
            type="date"
            name="startDate"
            required
            value={values.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
            className={inputStyles}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-bark">Vertrek</span>
          <input
            type="date"
            name="endDate"
            required
            min={values.startDate || undefined}
            value={values.endDate}
            onChange={(e) => set({ endDate: e.target.value })}
            className={inputStyles}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-bark">Naam</span>
          <input
            type="text"
            name="fullName"
            required
            autoComplete="off"
            value={values.fullName}
            onChange={(e) => set({ fullName: e.target.value })}
            className={inputStyles}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-bark">
            Aantal personen
          </span>
          <select
            name="guests"
            value={values.guests}
            onChange={(e) => set({ guests: e.target.value })}
            className={inputStyles}
          >
            {Array.from({ length: MAX_GUESTS }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-bark">
            E-mail{family && <span className="font-normal text-timber"> (mag leeg)</span>}
          </span>
          <input
            type="email"
            name="email"
            required={!family}
            autoComplete="off"
            value={values.email}
            onChange={(e) => set({ email: e.target.value })}
            className={inputStyles}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-bark">
            Telefoon <span className="font-normal text-timber">(mag leeg)</span>
          </span>
          <input
            type="tel"
            name="phone"
            autoComplete="off"
            value={values.phone}
            onChange={(e) => set({ phone: e.target.value })}
            className={inputStyles}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-bark">
            Notitie <span className="font-normal text-timber">(mag leeg)</span>
          </span>
          <input
            type="text"
            name="note"
            placeholder="bv. Afgesproken aan de telefoon"
            value={values.note}
            onChange={(e) => set({ note: e.target.value })}
            className={inputStyles}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-bark">
            Taal van de mails
          </span>
          <select
            name="locale"
            value={values.locale}
            onChange={(e) => set({ locale: e.target.value })}
            className={inputStyles}
          >
            <option value="nl">Nederlands</option>
            <option value="de">Duits</option>
            <option value="en">Engels</option>
          </select>
        </label>
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-timber">
        <input
          type="checkbox"
          name="notify"
          checked={values.notify}
          disabled={!values.email}
          onChange={(e) => set({ notify: e.target.checked })}
          className="mt-0.5"
        />
        <span>
          Stuur meteen een bevestigingsmail naar dit adres
          <span className="block">
            Staat uit: wie je zelf in de agenda zet, weet meestal al dat het
            doorgaat.
          </span>
        </span>
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-sand pt-4">
        <button
          disabled={pending}
          className="rounded-lg bg-bark px-5 py-2.5 text-sm font-semibold text-snow hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Toevoegen…" : "Boeking toevoegen"}
        </button>
        {state && (
          <p
            role="status"
            className={`text-sm ${state.ok ? "text-meadow-dark" : "text-red-700"}`}
          >
            {state.message}
          </p>
        )}
      </div>
      <p className="mt-3 text-sm text-timber">
        De boeking staat meteen als bevestigd in de agenda en de periode is op
        de site bezet. Hele weken hoeft hier niet: elke aankomst- en vertrekdag
        mag.
      </p>
    </form>
  );
}
