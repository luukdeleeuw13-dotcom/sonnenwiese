import "./globals.css";

// Minimale passthrough: de echte layout (html lang, fonts, nav, footer)
// leeft in src/app/[locale]/layout.tsx.
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
