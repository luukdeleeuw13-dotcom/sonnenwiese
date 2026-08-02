// Centrale site-URL: gebruikt in metadata en in e-maillinks.
// Wijzigen kan zonder codewijziging via de env var SITE_URL.
// Het apex-domein zonder www; www.sonnenwiese.nl stuurt daar sinds de
// verhuizing naar Cloudflare vanzelf naartoe.
export const SITE_URL = process.env.SITE_URL ?? "https://sonnenwiese.nl";

// Het openbare contactadres. Dit stond al op de oude site en wordt door
// Cloudflare Email Routing doorgestuurd naar de eigenaar — het privéadres
// van de eigenaar staat uitsluitend in de env var OWNER_NOTIFICATION_EMAIL
// en hoort niet in deze publieke repo thuis.
export const CONTACT_EMAIL = "mail@sonnenwiese.nl";
