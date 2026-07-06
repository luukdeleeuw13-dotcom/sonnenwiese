// Centrale site-URL: gebruikt in metadata en in e-maillinks.
// Na de domein-omzetting alleen de env var SITE_URL aanpassen.
export const SITE_URL =
  process.env.SITE_URL ?? "https://sonnenwiese.vercel.app";
