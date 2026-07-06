import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16: dit bestand heet proxy.ts (voorheen middleware.ts) en
// exporteert `proxy` in plaats van `middleware`.
export const proxy = createMiddleware(routing);

export const config = {
  // Alles behalve /api, /admin (Nederlandstalig, geen taalprefix),
  // Next-internals en statische bestanden met extensie.
  matcher: ["/((?!api|admin|_next|.*\\..*).*)"],
};
