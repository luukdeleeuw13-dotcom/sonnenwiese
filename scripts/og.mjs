// Bouwt public/og.jpg — het plaatje dat WhatsApp, Facebook en iMessage tonen
// als iemand sonnenwiese.nl deelt. Draaien met: node scripts/og.mjs
//
// Dit stond eerder in een wegwerpscriptje. Toen de bronfoto werd vervangen was
// het plaatje niet meer na te maken en verdween de naam eruit; vandaar dat het
// nu in de repo staat.
//
// De letters zijn Georgia en Helvetica, niet de Fraunces/Inter van de site:
// sharp rendert via systeemfonts en die twee zitten niet op het systeem. Op een
// deelkaartje van 1200 bij 630 valt het verschil niet op.
import sharp from "sharp";

const W = 1200;
const H = 630;
const BRON = "public/photos/omgeving-zomer-schuur.jpg";
const DOEL = "public/og.jpg";

const titel = "Sonnenwiese";
const onder = "Vakantieappartement voor 6–8 personen · Maria Alm, Oostenrijk";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Donker verloop onderaan, anders valt witte tekst weg tegen een lichte lucht.
const overlay = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.35" stop-color="#2b1d12" stop-opacity="0"/>
      <stop offset="1"    stop-color="#2b1d12" stop-opacity="0.72"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#v)"/>
  <text x="56" y="524" font-family="Georgia, 'Times New Roman', serif"
        font-size="76" font-weight="700" fill="#fdfcf9">${esc(titel)}</text>
  <text x="58" y="570" font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
        font-size="25" fill="#f4efe4">${esc(onder)}</text>
</svg>`);

// "attention" laat sharp zelf het interessantste deel kiezen; bij een liggende
// bronfoto houdt dat de bergkam in beeld in plaats van er middendoor te snijden.
await sharp(BRON)
  .resize(W, H, { fit: "cover", position: "attention" })
  .composite([{ input: overlay, top: 0, left: 0 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(DOEL);

console.log(`${DOEL} gebouwd uit ${BRON}`);
