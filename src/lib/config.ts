// Centrale site-URL: gebruikt in metadata en in e-maillinks.
// Wijzigen kan zonder codewijziging via de env var SITE_URL.
// Let op: het apex-domein (zonder www) — www.sonnenwiese.nl wijst nog
// naar de oude server zolang Yourhosting dat record niet uitrolt.
export const SITE_URL = process.env.SITE_URL ?? "https://sonnenwiese.nl";
