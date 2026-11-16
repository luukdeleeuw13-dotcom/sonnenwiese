import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  DEFAULT_SEASON_TABLE,
  parseSeasonTable,
  type SeasonTable,
} from "./seasons";

// Waar de seizoenstabel vandaan komt. Alleen op de server: de rekensom zelf
// staat in seasons.ts en mag overal draaien, maar de database is van hier.

const SETTINGS_KEY = "season_table";

export type LoadedSeasonTable = {
  table: SeasonTable;
  // "defaults" betekent: er is in het beheerscherm nog nooit iets opgeslagen,
  // of de instellingentabel bestaat nog niet (migratie 0005).
  source: "database" | "defaults";
  // De instellingentabel bestaat niet. Lezen gaat dan goed (we vallen terug
  // op de code), maar opslaan kan niet — het beheerscherm zegt dat erbij.
  missingTable: boolean;
};

// PostgREST meldt een tabel die het niet kent als PGRST205; Postgres zelf als
// 42P01. Allebei betekenen hier hetzelfde: migratie 0005 is nog niet gedraaid.
function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "PGRST205" || error?.code === "42P01";
}

// De geldende tabel. Gooit een fout als de database er wel hoort te zijn maar
// niet antwoordt: stilletjes terugvallen op de prijzen uit de code zou een
// oude prijs tonen zodra Supabase even hapert, en een oude prijs ziet er
// precies zo betrouwbaar uit als een goede. Wie deze functie aanroept kiest
// zelf wat een fout betekent — de prijzenpagina houdt dan haar vorige versie,
// de kalender toont geen bedrag.
export async function loadSeasonTable(): Promise<LoadedSeasonTable> {
  // Zonder Supabase (lokale dev vóór het aanmaken van accounts) is er geen
  // database om te raadplegen; dan geldt de tabel uit de code.
  if (!isSupabaseConfigured()) {
    return { table: DEFAULT_SEASON_TABLE, source: "defaults", missingTable: false };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle<{ value: unknown }>();

  if (error) {
    if (isMissingTable(error)) {
      return { table: DEFAULT_SEASON_TABLE, source: "defaults", missingTable: true };
    }
    throw new Error(`Seizoenstabel ophalen mislukt: ${error.message}`);
  }
  if (!data) {
    return { table: DEFAULT_SEASON_TABLE, source: "defaults", missingTable: false };
  }

  const table = parseSeasonTable(data.value);
  if (!table) {
    throw new Error("De opgeslagen seizoenstabel is niet leesbaar.");
  }
  return { table, source: "database", missingTable: false };
}

// Voor plekken waar een ontbrekend bedrag beter is dan een foutpagina: de
// kalender en het beheerscherm. `null` betekent "we weten het nu even niet".
export async function loadSeasonTableOrNull(): Promise<LoadedSeasonTable | null> {
  try {
    return await loadSeasonTable();
  } catch (e) {
    console.error(e);
    return null;
  }
}

export type SaveResult = { ok: true } | { ok: false; missingTable: boolean };

export async function saveSeasonTable(table: SeasonTable): Promise<SaveResult> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("settings").upsert({
    key: SETTINGS_KEY,
    value: table,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    console.error("Seizoenstabel opslaan mislukt:", error);
    return { ok: false, missingTable: isMissingTable(error) };
  }
  return { ok: true };
}
