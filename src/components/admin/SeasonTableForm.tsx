"use client";

import { startTransition, useActionState, useState } from "react";
import { saveSeasons } from "@/app/admin/actions";
import { isChangeoverDate } from "@/lib/booking/weeks";
import type { FormState } from "@/lib/admin/forms";
import type { SeasonKey, SeasonTable } from "@/lib/booking/seasons";

const inputStyles =
  "mt-1 block w-full rounded-lg border border-sand bg-cream px-3 py-2 text-bark";

const priceLabels: [SeasonKey, string][] = [
  ["winterHigh", "Winter — hoogseizoen"],
  ["winterLow", "Winter — laagseizoen"],
  ["summerHigh", "Zomer — hoogseizoen"],
  ["summerLow", "Zomer — laagseizoen"],
];

type Row = { id: number; season: string; from: string; to: string };

function euro(cents: number): string {
  return cents % 100 === 0
    ? String(cents / 100)
    : (cents / 100).toFixed(2).replace(".", ",");
}

// De prijzen en seizoenen, door de eigenaar zelf bij te stellen. In de browser
// omdat het aantal hoogseizoenen wisselt: een regel erbij of eraf moet kunnen
// zonder eerst op te slaan. Opgeslagen wordt er pas met de knop onderaan, en
// dan alles tegelijk (zie saveSeasons).
export default function SeasonTableForm({
  table,
  missingTable,
}: {
  table: SeasonTable;
  // Migratie 0005 heeft nog niet gedraaid: tonen kan, opslaan nog niet.
  missingTable: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    saveSeasons,
    null,
  );
  // De invoer staat in React en niet alleen in het formulier: na een
  // foutmelding van de server moet alles er nog staan zoals het was ingetikt.
  const [prices, setPrices] = useState(() =>
    Object.fromEntries(
      priceLabels.map(([key]) => [key, euro(table.prices[key])]),
    ) as Record<SeasonKey, string>,
  );
  const [rows, setRows] = useState<Row[]>(() =>
    table.highSeasons.map((r, i) => ({ id: i, ...r })),
  );
  const [nextId, setNextId] = useState(table.highSeasons.length);
  const [validFrom, setValidFrom] = useState(table.validFrom);
  const [validUntil, setValidUntil] = useState(table.validUntil);

  const update = (id: number, patch: Partial<Row>) =>
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );

  return (
    <form
      // Zelf versturen in plaats van via `action`: React zet een formulier na
      // een actie terug naar zijn beginstand, en bij een keuzelijst wint dat
      // van wat er in de state staat.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => action(formData));
      }}
      className="mt-3 rounded-card border border-sand bg-snow p-4"
    >
      {missingTable && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Opslaan kan nog niet: in Supabase moet eerst migratie{" "}
          <code>0005_settings.sql</code> worden uitgevoerd. Tot die tijd gelden
          de prijzen hieronder, zoals ze in de code staan.
        </p>
      )}

      <h3 className="font-semibold text-bark">Huurprijs per week</h3>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        {priceLabels.map(([key, label]) => (
          <label key={key} className="block">
            <span className="text-sm font-medium text-bark">{label}</span>
            <span className="relative block">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-timber">
                €
              </span>
              <input
                type="text"
                name={`price_${key}`}
                inputMode="decimal"
                required
                value={prices[key]}
                onChange={(e) =>
                  setPrices((current) => ({ ...current, [key]: e.target.value }))
                }
                className={`${inputStyles} pl-8`}
              />
            </span>
          </label>
        ))}
      </div>

      <h3 className="mt-6 font-semibold text-bark">Hoogseizoenen</h3>
      <p className="mt-1 text-sm text-timber">
        Van zaterdag tot zaterdag. Een week telt als hoogseizoen als hij er
        helemaal binnen valt; alle andere weken zijn laagseizoen.
      </p>
      <div className="mt-3 space-y-3">
        {rows.length === 0 && (
          <p className="text-sm text-timber">
            Er staan geen hoogseizoenen in: elke week is nu laagseizoen.
          </p>
        )}
        {rows.map((row) => {
          const notSaturday =
            (row.from !== "" && !isChangeoverDate(row.from)) ||
            (row.to !== "" && !isChangeoverDate(row.to));
          return (
            // Elke periode in zijn eigen kader: op een telefoon vallen de
            // velden onder elkaar, en zonder kader is niet te zien waar de
            // ene periode ophoudt en de volgende begint.
            <div key={row.id} className="rounded-lg border border-sand p-3">
              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="text-sm font-medium text-bark">Seizoen</span>
                  <select
                    name="hs_season"
                    value={row.season}
                    onChange={(e) => update(row.id, { season: e.target.value })}
                    className={inputStyles}
                  >
                    <option value="winterHigh">Winter</option>
                    <option value="summerHigh">Zomer</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-bark">Van</span>
                  <input
                    type="date"
                    name="hs_from"
                    required
                    value={row.from}
                    onChange={(e) => update(row.id, { from: e.target.value })}
                    className={inputStyles}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-bark">Tot</span>
                  <input
                    type="date"
                    name="hs_to"
                    required
                    value={row.to}
                    onChange={(e) => update(row.id, { to: e.target.value })}
                    className={inputStyles}
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setRows((current) => current.filter((r) => r.id !== row.id))
                  }
                  className="rounded-lg px-3 py-2 text-sm text-timber/70 hover:text-red-700"
                >
                  Verwijderen
                </button>
              </div>
              {notSaturday && (
                <p className="mt-1 text-sm text-red-700">
                  Eén van deze datums is geen zaterdag.
                </p>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => {
          setRows((current) => [
            ...current,
            { id: nextId, season: "winterHigh", from: "", to: "" },
          ]);
          setNextId(nextId + 1);
        }}
        className="mt-3 rounded-lg border border-sand bg-cream px-4 py-2 text-sm font-semibold text-timber hover:border-timber"
      >
        + Periode toevoegen
      </button>

      <h3 className="mt-6 font-semibold text-bark">Looptijd</h3>
      <p className="mt-1 text-sm text-timber">
        Voor aankomsten buiten deze periode noemt de site geen bedrag: liever
        geen prijs dan een prijs uit de vakantiekalender van vorig jaar. Zet de
        einddatum dus pas verder als ook de hoogseizoenen van dat jaar erin
        staan.
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <label className="block">
          <span className="text-sm font-medium text-bark">Geldig vanaf</span>
          <input
            type="date"
            name="validFrom"
            required
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className={inputStyles}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-bark">
            Tot en met aankomst op
          </span>
          <input
            type="date"
            name="validUntil"
            required
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className={inputStyles}
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-sand pt-4">
        <button
          disabled={pending}
          className="rounded-lg bg-bark px-5 py-2.5 text-sm font-semibold text-snow hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Opslaan…" : "Prijzen opslaan"}
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
        Een bedrag dat al bij een boeking is vastgelegd verandert hierdoor
        niet; alleen nieuwe voorstellen en de prijzen op de site.
      </p>
    </form>
  );
}
