// Simpele snelheidsbegrenzer in het geheugen van de serverinstantie.
//
// Bewuste beperking: Vercel draait meerdere instanties, elk met een eigen
// Map. Iemand die vastberaden is kan dit dus omzeilen. Het doel is niet
// waterdicht zijn, maar voorkomen dat één script in één minuut duizend
// aanvragen in de database en de mailbox van de eigenaar dumpt. Voor echt
// waterdichte begrenzing is een gedeelde teller nodig (Upstash/Redis).

const WINDOW_MS = 60 * 60 * 1000; // 1 uur
const MAX_PER_WINDOW = 5;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;

  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  hits.set(key, recent);

  // Verlopen sleutels opruimen zodat de Map niet oneindig groeit.
  if (hits.size > 500) {
    for (const [k, times] of hits) {
      if (times.every((t) => t <= cutoff)) hits.delete(k);
    }
  }

  return false;
}

// Achter Vercel is x-forwarded-for de enige betrouwbare bron; de eerste
// waarde is de bezoeker, de rest zijn proxy's.
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "onbekend";
}
