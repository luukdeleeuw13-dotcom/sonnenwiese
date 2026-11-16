"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  isAdmin,
  isPasswordCorrect,
  sessionToken,
} from "@/lib/admin/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendGuestEmail } from "@/lib/email/sendGuestEmail";
import { sendPaymentEmail } from "@/lib/email/sendPaymentEmail";
import { formatLongDate } from "@/lib/email/localeDate";
import { paymentDetails, primaryOwnerEmail } from "@/lib/config";
import { isOwnerBlock } from "@/lib/admin/bookings";
import { parseEuro } from "@/lib/admin/payments";
import {
  estimatePrice,
  parseSeasonTable,
  SEASON_KEYS,
  type HighSeason,
  type SeasonKey,
} from "@/lib/booking/seasons";
import {
  loadSeasonTableOrNull,
  saveSeasonTable,
} from "@/lib/booking/seasonTable";
import { isChangeoverDate } from "@/lib/booking/weeks";
import { MAX_GUESTS } from "@/lib/booking/capacity";
import type { FormState } from "@/lib/admin/forms";
import type { BookingRow } from "@/lib/supabase/types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!isPasswordCorrect(password)) {
    redirect("/admin?fout=1");
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 dagen
    path: "/",
  });
  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  redirect("/admin");
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin");
}

// Status wijzigen (accepteren/afwijzen) + automatische gastmail.
export async function setBookingStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "confirmed" && status !== "rejected")) return;

  const supabase = getSupabaseServerClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single<BookingRow>();
  if (!booking || booking.status === status) return;

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error("Admin: status update failed:", error);
    return;
  }

  // Handmatige blokkades (blokkeer-formulier) krijgen geen gastmail, en een
  // zelf ingevoerde boeking zonder mailadres evenmin.
  if (!isOwnerBlock(booking) && booking.email) {
    try {
      await sendGuestEmail(booking, status);
    } catch (e) {
      console.error("Admin: guest email failed:", e);
    }
  }
  revalidatePath("/admin");
}

export async function deleteBooking(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) console.error("Admin: delete failed:", error);
  revalidatePath("/admin");
}

// Een vraag als beantwoord markeren. Hij blijft staan tot de bewaartermijn
// hem opruimt — zo kun je terugzien wat er gevraagd is, zonder dat hij
// bovenaan in de weg blijft staan.
export async function setInquiryHandled(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const handled = String(formData.get("handled") ?? "") === "true";
  if (!id) return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ handled })
    .eq("id", id);
  if (error) console.error("Admin: vraag bijwerken mislukt:", error);
  revalidatePath("/admin");
}

export async function deleteInquiry(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) console.error("Admin: vraag verwijderen mislukt:", error);
  revalidatePath("/admin");
}

// Nota verstuurd / betaald aan- of uitzetten. We slaan het moment op en niet
// een vinkje, zodat je later terugziet wanneer het gebeurde.
export async function togglePaymentMoment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  const on = String(formData.get("value") ?? "") === "on";
  if (!id) return;
  if (field !== "invoice_sent_at" && field !== "paid_at") return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .update({ [field]: on ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) console.error("Admin: betaalstatus bijwerken mislukt:", error);
  revalidatePath("/admin");
}

// Familie krijgt geen nota. Zonder deze knop zou zo'n verblijf tot de dag van
// aankomst als onbetaald in het overzicht blijven staan.
export async function setInvoiceRequired(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const required = String(formData.get("value") ?? "") === "true";
  if (!id) return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .update({ invoice_required: required })
    .eq("id", id);
  if (error) console.error("Admin: notaplicht bijwerken mislukt:", error);
  revalidatePath("/admin");
}

// Het afgesproken bedrag, voorlopig met de hand ingevuld.
export async function setPrice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const cents = parseEuro(String(formData.get("price") ?? ""));
  // undefined betekent: hier staat iets wat geen bedrag is. Dan liever een
  // melding dan stilletjes de prijs wissen.
  if (cents === undefined) redirect("/admin?prijsfout=1");

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("bookings")
    .update({ price_cents: cents })
    .eq("id", id);
  if (error) console.error("Admin: bedrag bijwerken mislukt:", error);
  revalidatePath("/admin");
}

// Het voorgestelde bedrag uit de seizoenstabel overnemen. Het bedrag komt
// bewust niet uit het formulier maar wordt hier opnieuw uitgerekend uit de
// datums in de database: een bedrag dat je van de browser aanneemt is een
// bedrag dat je niet kent.
export async function applySuggestedPrice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseServerClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("start_date,end_date")
    .eq("id", id)
    .single<Pick<BookingRow, "start_date" | "end_date">>();
  if (!booking) return;

  const seasons = await loadSeasonTableOrNull();
  if (!seasons) return;
  const estimate = estimatePrice(
    booking.start_date,
    booking.end_date,
    seasons.table,
  );
  if (!estimate.ok) return;

  const { error } = await supabase
    .from("bookings")
    .update({ price_cents: estimate.totalCents })
    .eq("id", id);
  if (error) console.error("Admin: voorstel overnemen mislukt:", error);
  revalidatePath("/admin");
}

// Het betaalverzoek naar de gast sturen, in zijn eigen taal, met bedrag,
// rekeningnummer en betalingskenmerk erin.
//
// Bewust een knop en geen automatische taak. De site weet wanneer een nota
// verstuurd zou moeten zijn, maar niet of er intussen iets anders is
// afgesproken — een appje, een korting, familie die toch meebetaalt. Eén klik
// is weinig gevraagd voor het verschil tussen een mail die klopt en een mail
// die iemand moet rechtzetten.
export async function sendInvoice(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = getSupabaseServerClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single<BookingRow>();
  if (!booking) return;

  if (typeof booking.price_cents !== "number") {
    redirect("/admin?mailfout=geenbedrag");
  }
  if (!paymentDetails()) {
    redirect("/admin?mailfout=geenrekening");
  }

  // De redirect hieronder mag niet in de try: `redirect()` werkt via een
  // exception, en een catch eromheen zou hem opslokken.
  let failed = false;
  try {
    await sendPaymentEmail(booking, "request");
  } catch (e) {
    console.error("Admin: betaalverzoek versturen mislukt:", e);
    failed = true;
  }
  if (failed) redirect("/admin?mailfout=1");

  // Pas noteren als de mail echt weg is: "verstuurd" moet betekenen dat er
  // iets verstuurd is.
  const { error } = await supabase
    .from("bookings")
    .update({ invoice_sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) console.error("Admin: nota-datum noteren mislukt:", error);
  revalidatePath("/admin");
}

// Handmatig een periode blokkeren (eigen gebruik, familie, onderhoud):
// een gewone rij met status confirmed, herkenbaar aan het eigenaarsmailadres.
export async function blockPeriod(formData: FormData) {
  await requireAdmin();
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return;
  if (endDate <= startDate) return;

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("bookings").insert({
    status: "confirmed",
    start_date: startDate,
    end_date: endDate,
    guests: 1,
    full_name: note || "Geblokkeerd door eigenaar",
    email: primaryOwnerEmail(),
    locale: "nl",
  });
  if (error) console.error("Admin: block failed:", error);
  revalidatePath("/admin");
}

// Een boeking die buiten de site om is afgesproken — aan de telefoon, op een
// verjaardag — alsnog in de agenda zetten. Hij staat meteen als bevestigd:
// er valt niets meer te accepteren, de afspraak is er al.
//
// Familie of gast is hier dezelfde schakelaar als de knop "Geen nota nodig"
// bij een bestaande boeking (invoice_required). Voor familie komt er dus geen
// nota, geen betaalverzoek en geen betaalcontrole; al het andere is gelijk.
export async function addBooking(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const startDate = text("startDate");
  const endDate = text("endDate");
  const fullName = text("fullName").slice(0, 200);
  const email = text("email").slice(0, 200);
  const phone = text("phone").slice(0, 50);
  const note = text("note").slice(0, 2000);
  const guests = Number(text("guests"));
  const family = text("kind") === "family";
  const notify = formData.get("notify") === "on";
  const rawLocale = text("locale");
  const locale = rawLocale === "de" || rawLocale === "en" ? rawLocale : "nl";

  if (!isDate(startDate) || !isDate(endDate)) {
    return { ok: false, message: "Vul een aankomst- en een vertrekdatum in." };
  }
  if (endDate <= startDate) {
    return { ok: false, message: "De vertrekdatum moet na de aankomstdatum liggen." };
  }
  if (!fullName) {
    return { ok: false, message: "Vul een naam in." };
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > MAX_GUESTS) {
    return {
      ok: false,
      message: `Het aantal personen moet tussen 1 en ${MAX_GUESTS} liggen.`,
    };
  }
  if (email && !EMAIL_RE.test(email)) {
    return { ok: false, message: "Dat mailadres klopt niet." };
  }
  // Een betalende gast krijgt het betaalverzoek per mail; zonder adres loopt
  // dat later vast op een moment dat niemand er meer aan denkt. Familie
  // krijgt geen nota, dus daar mag het adres leeg blijven.
  if (!family && !email) {
    return {
      ok: false,
      message:
        "Vul een mailadres in — dat is nodig om straks het betaalverzoek te sturen. Bij familie mag het leeg blijven.",
    };
  }
  if (notify && !email) {
    return {
      ok: false,
      message: "Zonder mailadres kan er geen bevestiging verstuurd worden.",
    };
  }

  const supabase = getSupabaseServerClient();

  // Dezelfde regel als bij een aanvraag via de site: wat al bevestigd is,
  // wordt niet dubbel geboekt. Ook een eigen blokkade telt — die moet dan
  // eerst weg.
  const { data: overlapping, error: overlapError } = await supabase
    .from("bookings")
    .select("full_name,start_date,end_date")
    .eq("status", "confirmed")
    .lt("start_date", endDate)
    .gt("end_date", startDate)
    .limit(1);
  if (overlapError) {
    console.error("Admin: overlap controleren mislukt:", overlapError);
    return { ok: false, message: "De agenda kon niet worden nagekeken. Probeer het zo nog eens." };
  }
  if (overlapping && overlapping.length > 0) {
    return {
      ok: false,
      message: `Die periode overlapt met “${overlapping[0].full_name}” (${formatLongDate(overlapping[0].start_date, "nl")} tot ${formatLongDate(overlapping[0].end_date, "nl")}). Er is niets toegevoegd.`,
    };
  }

  const { data: inserted, error } = await supabase
    .from("bookings")
    .insert({
      status: "confirmed",
      start_date: startDate,
      end_date: endDate,
      guests,
      full_name: fullName,
      // De kolom mag niet leeg zijn (not null), een lege tekst mag wel. Overal
      // waar gemaild wordt staat een controle op een leeg adres.
      email,
      phone: phone || null,
      message: note || null,
      locale,
      invoice_required: !family,
    })
    .select("*")
    .single<BookingRow>();
  if (error || !inserted) {
    console.error("Admin: boeking toevoegen mislukt:", error);
    return { ok: false, message: "De boeking kon niet worden opgeslagen. Probeer het zo nog eens." };
  }
  revalidatePath("/admin");

  if (notify) {
    try {
      await sendGuestEmail(inserted, "confirmed");
    } catch (e) {
      console.error("Admin: bevestiging bij handmatige boeking mislukt:", e);
      return {
        ok: true,
        message: `${fullName} staat in de agenda, maar de bevestigingsmail kon niet worden verzonden. Neem zelf even contact op.`,
      };
    }
    return {
      ok: true,
      message: `${fullName} staat in de agenda en heeft een bevestiging gekregen.`,
    };
  }
  return { ok: true, message: `${fullName} staat in de agenda.` };
}

// De prijzen en seizoenen opslaan. Alles tegelijk en niet per veld: de vier
// prijzen, de hoogseizoenen en de looptijd vormen samen één tabel, en een
// half bijgewerkte tabel (nieuwe prijzen bij de vakanties van vorig jaar)
// rekent bedragen uit die niemand zo bedoeld heeft.
export async function saveSeasons(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const prices = {} as Record<SeasonKey, number>;
  for (const key of SEASON_KEYS) {
    const cents = parseEuro(String(formData.get(`price_${key}`) ?? ""));
    if (typeof cents !== "number" || cents <= 0) {
      return {
        ok: false,
        message:
          "Eén van de prijzen kon ik niet lezen — er is niets gewijzigd. Schrijf een bedrag als 1850 of 1850,00.",
      };
    }
    prices[key] = cents;
  }

  const seasons = formData.getAll("hs_season").map(String);
  const froms = formData.getAll("hs_from").map(String);
  const tos = formData.getAll("hs_to").map(String);
  const highSeasons: HighSeason[] = [];
  for (let i = 0; i < seasons.length; i++) {
    const from = (froms[i] ?? "").trim();
    const to = (tos[i] ?? "").trim();
    // Een regel zonder datums is een regel die iemand heeft leeggemaakt.
    if (!from && !to) continue;
    const season = seasons[i];
    if (season !== "winterHigh" && season !== "summerHigh") {
      return { ok: false, message: "Kies bij elke periode winter of zomer." };
    }
    if (!isDate(from) || !isDate(to)) {
      return {
        ok: false,
        message: "Bij een hoogseizoen ontbreekt een begin- of einddatum.",
      };
    }
    if (to <= from) {
      return {
        ok: false,
        message: "Bij een hoogseizoen ligt de einddatum niet na de begindatum.",
      };
    }
    // Een week telt alleen als hoogseizoen als hij er helemaal binnen valt.
    // Een periode die op een woensdag begint zou de eerste week dus
    // stilletjes als laagseizoen laten rekenen — vandaar zaterdagen.
    if (!isChangeoverDate(from) || !isChangeoverDate(to)) {
      return {
        ok: false,
        message:
          "Een hoogseizoen loopt van zaterdag tot zaterdag, net als de verhuurweken. Eén van de datums is geen zaterdag.",
      };
    }
    highSeasons.push({ season, from, to });
  }

  highSeasons.sort((a, b) => a.from.localeCompare(b.from));
  for (let i = 1; i < highSeasons.length; i++) {
    if (highSeasons[i].from < highSeasons[i - 1].to) {
      return {
        ok: false,
        message: "Twee hoogseizoenen overlappen elkaar. Er is niets gewijzigd.",
      };
    }
  }

  const validFrom = String(formData.get("validFrom") ?? "").trim();
  const validUntil = String(formData.get("validUntil") ?? "").trim();
  if (!isDate(validFrom) || !isDate(validUntil) || validUntil <= validFrom) {
    return {
      ok: false,
      message:
        "Vul in van wanneer tot wanneer deze prijzen gelden, met de einddatum na de begindatum.",
    };
  }

  const table = parseSeasonTable({ prices, highSeasons, validFrom, validUntil });
  if (!table) {
    return { ok: false, message: "De tabel klopt niet. Er is niets gewijzigd." };
  }

  const result = await saveSeasonTable(table);
  if (!result.ok) {
    return {
      ok: false,
      message: result.missingTable
        ? "Opslaan kan nog niet: in Supabase moet eerst migratie 0005_settings.sql worden uitgevoerd."
        : "De prijzen konden niet worden opgeslagen. Probeer het zo nog eens.",
    };
  }

  // De prijzenpagina is vooraf gebouwd; zonder dit seintje zou hij tot een
  // uur lang de oude bedragen tonen.
  revalidatePath("/[locale]/prijzen", "page");
  revalidatePath("/admin");
  return { ok: true, message: "Opgeslagen. De prijzenpagina en de kalender rekenen er nu mee." };
}
