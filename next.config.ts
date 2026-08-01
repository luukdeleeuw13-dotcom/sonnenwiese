import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// De oude Joomla-site draaide jarenlang op /index.php/<pagina>. Die adressen
// staan in Google en in oude gedeelde links; zonder deze regels landt
// iedereen die zo binnenkomt op een 404. De oude site was Nederlandstalig,
// dus alles gaat naar /nl.
const legacyPaths: Record<string, string> = {
  "/index.php": "/nl",
  "/index.php/foto-s": "/nl/fotos",
  "/index.php/prijzen": "/nl/prijzen",
  "/index.php/route": "/nl/route-praktisch",
  "/index.php/voorwaarden": "/nl/route-praktisch",
  "/index.php/vragen": "/nl/route-praktisch",
  "/index.php/links": "/nl/omgeving",
};

const nextConfig: NextConfig = {
  async redirects() {
    return [
      ...Object.entries(legacyPaths).map(([source, destination]) => ({
        source,
        destination,
        permanent: true,
      })),
      // Vangnet voor alles wat verder onder /index.php hing (zoekpagina,
      // inlogformulieren van Joomla). Moet ná de specifieke regels staan.
      { source: "/index.php/:path*", destination: "/nl", permanent: true },
    ];
  },
};

export default withNextIntl(nextConfig);
