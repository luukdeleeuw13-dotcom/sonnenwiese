// Schaalt de foto's die groot in beeld komen naar 2048 px breed.
// Draaien met: node scripts/foto-schaal.mjs
//
// WAAROM DIT BESTAAT
// De foto's die we van de eigenaar kregen zijn 1024 px breed. Een hero staat
// over de volle schermbreedte: op een scherm van 1440 px met een retina-paneel
// vraagt de browser om 2880 echte beeldpunten. Die 1024 werden dus bijna drie
// keer uitgerekt, en dat is precies waarom de hero wazig oogde terwijl de
// kleine foto's in het mozaïek scherp waren — die krijgen juist méér punten
// dan ze nodig hebben.
//
// WAT DIT WEL EN NIET IS
// Hier komt geen detail bij dat er niet was. Wat er wél gebeurt: het uitrekken
// gebeurt nu één keer, vooraf, met lanczos in plaats van live in de browser
// met een goedkoper filter, en er gaat een lichte verscherping overheen die de
// randen terughaalt die bij het uitrekken vervagen. Naast elkaar gelegd is het
// verschil goed te zien in houtnerf en takken. Het resultaat is niet zo goed
// als een echt origineel van 4032 px — de EXIF zegt dat dat bestaat, geschoten
// met een iPhone XR. Komt dat boven water, gooi het er dan overheen en gooi
// dit script weg.
//
// De oude 1024-versies staan gewoon in de geschiedenis van git, mocht dit
// tegenvallen.
import sharp from "sharp";
import { stat } from "node:fs/promises";

const DOEL_BREEDTE = 2048;

// Alleen foto's die groter dan een tegeltje in beeld komen. De rest van de map
// staat in het mozaïek en op de fotopagina, en is daar al scherp genoeg.
const FOTOS = [
  "omgeving-zomer-schuur.jpg", // hero homepage
  "omgeving-winter-kapel-weide.jpg", // brede band homepage
  "omgeving-winter-weide.jpg", // hero /omgeving
  "woonkamer-3.jpg", // hero /appartement
  "omgeving-winter-spiegeling.jpg", // seizoensblok, halve breedte
  "omgeving-zomer-wandelpad.jpg", // seizoensblok, halve breedte
];

const kb = (n) => `${Math.round(n / 1024)} kB`;

for (const naam of FOTOS) {
  const pad = `public/photos/${naam}`;
  const voor = await sharp(pad).metadata();

  if (voor.width >= DOEL_BREEDTE) {
    console.log(`${naam}: al ${voor.width} px breed, overgeslagen`);
    continue;
  }

  const oudeBytes = (await stat(pad)).size;

  // sharpen: sigma bepaalt hoe breed de rand is die wordt aangezet, m1/m2 hoe
  // hard. Deze waarden zijn met het blote oog gekozen op de schuurfoto —
  // genoeg om de houtnerf terug te halen, niet zoveel dat er witte randjes om
  // de bergkam komen.
  const uit = await sharp(pad)
    .resize(DOEL_BREEDTE, null, { kernel: "lanczos3" })
    .sharpen({ sigma: 1.1, m1: 0.6, m2: 2.2 })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  // Pas op het laatst schrijven: sharp mag niet uit hetzelfde bestand lezen
  // waar het naartoe schrijft.
  await sharp(uit).toFile(pad);

  const na = await sharp(pad).metadata();
  console.log(
    `${naam}: ${voor.width}x${voor.height} (${kb(oudeBytes)}) -> ` +
      `${na.width}x${na.height} (${kb(uit.length)})`,
  );
}
