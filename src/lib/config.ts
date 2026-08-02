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

// OWNER_NOTIFICATION_EMAIL mag meerdere adressen bevatten, gescheiden door
// komma's: alle meldingen gaan dan naar iedereen die meekijkt, zodat een
// aanvraag niet in één inbox blijft liggen. De accepteer- en afwijslinks in
// die mail werken op een ondertekende link, dus elke ontvanger kan meteen
// beslissen — dat is precies de bedoeling.
export function ownerEmails(): string[] {
  return (process.env.OWNER_NOTIFICATION_EMAIL ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

// Het eerste adres is dat van de eigenaar zelf. Daaraan herkennen we ook de
// handmatige blokkades in de agenda, dus de volgorde in de env var is niet
// vrijblijvend: de eigenaar hoort vooraan.
export function primaryOwnerEmail(): string {
  return ownerEmails()[0] ?? CONTACT_EMAIL;
}

// Een IBAN wordt per vier tekens gelezen; zo staat hij ook op een afschrift
// en zo tikt iemand hem zonder fouten over in zijn bankapp.
export function formatIban(iban: string): string {
  return iban
    .replace(/\s+/g, "")
    .toUpperCase()
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

// De rekeninggegevens voor het betaalverzoek. Ze staan bewust in env vars en
// niet in de code: dit is een openbare repo, en een rekeningnummer dat één
// keer in de geschiedenis staat krijg je er nooit meer uit.
//
// Ontbreekt er één van de twee, dan geeft dit `null` en gaat er geen mail uit.
// Een betaalverzoek zonder rekeningnummer is erger dan geen betaalverzoek: de
// gast weet dan wél dat hij moet betalen, maar niet waarheen.
export function paymentDetails(): { iban: string; accountName: string } | null {
  const iban = (process.env.OWNER_IBAN ?? "").replace(/\s+/g, "");
  const accountName = (process.env.OWNER_ACCOUNT_NAME ?? "").trim();
  if (!iban || !accountName) return null;
  return { iban: formatIban(iban), accountName };
}
