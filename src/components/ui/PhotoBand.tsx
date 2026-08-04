import Image from "next/image";

// Eén foto over de volle schermbreedte, zonder tekst erop.
//
// De homepage was een stapel even brede blokken; de seizoenssecties waren het
// mooiste stuk juist omdát ze uitbreken. Deze band is een pauze tussen het
// verhaal en de praktische kaartjes — bergen verdienen breedte, en een pagina
// heeft een plek nodig waar even niets gevraagd wordt.
export default function PhotoBand({ src, alt }: { src: string; alt: string }) {
  return (
    <section
      aria-hidden={false}
      className="relative h-[40svh] w-full overflow-hidden sm:h-[54svh]"
    >
      <Image
        src={src}
        alt={alt}
        fill
        // Altijd de volle schermbreedte; zonder deze hint kiest Next de
        // standaardaanname en stuurt hij een te kleine variant naar een breed
        // scherm.
        sizes="100vw"
        // Het zwaartepunt van deze foto ligt onder het midden: de bergkam vult
        // de bovenhelft, het kapelletje staat lager. Een strakke middencrop
        // snijdt precies daar doorheen.
        className="photo-band object-cover object-[center_62%]"
      />
    </section>
  );
}
