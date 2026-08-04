import { useTranslations } from "next-intl";

type Testimonial = { quote: string; name: string };

// Wat eerdere gasten zeggen, vlak voor de vraag of je wilt komen.
//
// De citaten staan in de taalbestanden onder `home.testimonials`, als lijst.
// Zolang die lijst leeg is rendert deze sectie niets: een kopje "Wat gasten
// zeggen" boven een lege ruimte is erger dan geen kopje, en verzonnen citaten
// zijn geen optie op een site waar mensen geld op overmaken.
//
// Een citaat toevoegen is dus één regel per taal:
//   "testimonials": [{ "quote": "…", "name": "Familie Jansen, 2024" }]
export default function Testimonials() {
  const t = useTranslations("home");
  const items = t.raw("testimonials") as Testimonial[] | undefined;

  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <h2 className="text-center font-display text-2xl font-semibold text-bark sm:text-3xl">
        {t("testimonialsTitle")}
      </h2>
      {/* Even hoge kaarten, net als de drie kaartjes verderop op de homepage:
          citaten zijn zelden even lang, en drie randen op verschillende hoogtes
          lezen als een fout in plaats van als een keuze. De naam zakt daarom
          naar de onderkant in plaats van achter de tekst aan te lopen. */}
      <div className="mt-8 grid items-stretch gap-5 sm:grid-cols-3">
        {items.map((item) => (
          <figure
            key={item.name}
            className="flex h-full flex-col rounded-card border border-sand bg-snow p-6"
          >
            {/* Het aanhalingsteken is decoratie, geen tekst — een schermlezer
                zou "rechts dubbel aanhalingsteken" voorlezen en dat helpt niet. */}
            <span aria-hidden className="font-display text-4xl leading-none text-meadow">
              &rdquo;
            </span>
            <blockquote className="mt-2 flex-1 leading-relaxed text-timber">
              {item.quote}
            </blockquote>
            <figcaption className="mt-4 pt-1 text-sm font-semibold text-bark">
              {item.name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
