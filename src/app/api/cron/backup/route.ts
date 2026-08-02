import { NextResponse } from "next/server";
import { collectBackup } from "@/lib/backup/collect";
import { sendBackupEmail } from "@/lib/email/sendBackupEmail";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

// De wekelijkse back-up. Supabase maakt op het gratis plan geen back-ups, en
// een export die je zelf moet onthouden is geen back-up maar een goed
// voornemen. Dus stuurt de site elke zondagochtend ongevraagd alle boekingen
// en vragen als CSV naar de eigenaren. Staat het in je mailbox, dan staat het
// ook ergens anders dan bij Supabase — dat is het hele punt.
//
// Beveiliging werkt zoals bij de andere taken: staat CRON_SECRET ingesteld,
// dan moet Vercel die als bearer token meesturen. Anders dan bij keepalive is
// dat hier geen luxe — dit endpoint verstuurt persoonsgegevens per mail. Ze
// gaan weliswaar altijd naar de vaste adressen uit OWNER_NOTIFICATION_EMAIL
// en nooit naar een adres uit het verzoek, maar zonder token kan een vreemde
// wel eindeloos mail laten versturen.
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "supabase-not-configured" },
      { status: 500 }
    );
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return NextResponse.json(
      { ok: false, reason: "resend-not-configured" },
      { status: 500 }
    );
  }

  try {
    const { summary, files } = await collectBackup(getSupabaseServerClient());
    await sendBackupEmail(summary, files);
    return NextResponse.json({
      ok: true,
      bookings: summary.bookings,
      inquiries: summary.inquiries,
    });
  } catch (e) {
    // Een back-up die stilletjes overslaat is geen back-up. Loggen én een 500
    // teruggeven, zodat Vercel de taak als mislukt markeert en het zichtbaar
    // is in het dashboard.
    console.error("Wekelijkse back-up mislukt:", e);
    return NextResponse.json(
      { ok: false, reason: "backup-failed" },
      { status: 500 }
    );
  }
}
