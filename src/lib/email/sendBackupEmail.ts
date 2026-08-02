import { sendEmail } from "./send";
import { SITE_URL, ownerEmails } from "@/lib/config";

// De wekelijkse back-upmail. Twee CSV-bijlagen en een korte samenvatting, in
// het Nederlands en zonder jargon: de ontvanger is de eigenaar, niet een
// beheerder. De samenvatting staat er niet voor de sier — daaraan zie je in
// twee tellen of de back-up ergens op slaat. Nul boekingen terwijl je er drie
// verwacht, is precies het soort stilte dat je wilt opmerken.

export type BackupSummary = {
  date: string; // in woorden, bv. "3 augustus 2026"
  bookings: number;
  confirmed: number;
  pending: number;
  inquiries: number;
  nextStay: string | null;
  openInvoices: string | null;
};

export type BackupFile = { filename: string; csv: string };

// Opbouwen en versturen zijn gescheiden, zodat de mail te controleren is
// zonder dat er iets verstuurd wordt.
export function buildBackupEmail(summary: BackupSummary, files: BackupFile[]) {
  const lines: string[] = [
    `${summary.bookings} boeking${summary.bookings === 1 ? "" : "en"} in totaal` +
      ` — waarvan ${summary.confirmed} bevestigd` +
      (summary.pending > 0 ? ` en ${summary.pending} nog te beantwoorden` : ""),
    `${summary.inquiries} ${summary.inquiries === 1 ? "vraag" : "vragen"}`,
  ];
  if (summary.nextStay) lines.push(`Eerstkomend verblijf: ${summary.nextStay}`);
  if (summary.openInvoices) lines.push(`Nota's: ${summary.openInvoices}`);

  const html = `
  <div style="font-family: Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #4a3728;">
    <h2 style="font-family: Georgia, serif;">Back-up van ${summary.date}</h2>
    <ul style="line-height: 1.7; padding-left: 20px;">
      ${lines.map((l) => `<li>${l}</li>`).join("\n      ")}
    </ul>
    <p style="background: #f5efe3; border-radius: 8px; padding: 14px 16px; line-height: 1.6;">
      In de bijlage staan alle boekingen en alle vragen als CSV-bestand: te
      openen in Excel of Numbers, en desnoods weer in de database terug te
      zetten. Bewaar de nieuwste mail; oudere back-ups mag je weggooien — daar
      staan gegevens in van mensen die inmiddels om verwijdering gevraagd
      kunnen hebben.
    </p>
    <p style="font-size: 14px;">
      <a href="${SITE_URL}/admin" style="color: #55663e;">Naar het beheerscherm →</a>
    </p>
  </div>`;

  const text = [
    `Back-up van ${summary.date}`,
    "",
    ...lines.map((l) => `- ${l}`),
    "",
    "In de bijlage staan alle boekingen en alle vragen als CSV-bestand.",
    "Bewaar de nieuwste mail; oudere back-ups mag je weggooien.",
    "",
    `Beheerscherm: ${SITE_URL}/admin`,
  ].join("\n");

  return {
    subject: `Back-up sonnenwiese.nl — ${summary.date}`,
    html,
    text,
    attachments: files.map((f) => ({
      filename: f.filename,
      // Resend wil de inhoud als base64; de BOM zit er al in zodat Excel de
      // umlauten van Duitse gasten goed leest.
      content: Buffer.from(f.csv, "utf8").toString("base64"),
    })),
  };
}

export async function sendBackupEmail(
  summary: BackupSummary,
  files: BackupFile[]
) {
  await sendEmail({
    from: process.env.RESEND_FROM_EMAIL!,
    to: ownerEmails(),
    ...buildBackupEmail(summary, files),
  });
}
