import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/config";

// De pagina die je te zien krijgt na een klik op een knop in de eigenaarsmail.
// Bewust een kale HTML-string en geen React-pagina: dit is de laatste stap van
// een handeling, geen plek om rond te kijken. Eén regel over wat er gebeurd is
// en een weg terug naar het beheerscherm.
export function resultPage(
  title: string,
  body: string,
  ok = true
): NextResponse {
  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${title} — Sonnenwiese</title></head>
<body style="margin:0;background:#faf6ee;color:#4a3728;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;padding:48px 24px;text-align:center;">
    <div style="font-size:48px;">${ok ? "✅" : "⚠️"}</div>
    <h1 style="font-family:Georgia,serif;font-size:28px;margin:16px 0 8px;">${title}</h1>
    <p style="line-height:1.6;color:#7c5c42;">${body}</p>
    <p style="margin-top:32px;"><a href="${SITE_URL}/admin" style="color:#55663e;font-weight:600;">Naar het aanvragenoverzicht →</a></p>
  </div>
</body></html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  }) as NextResponse;
}
